import { withRetry } from "@/utils/retry";

// whatai.cc 统一 API 配置
const WHATAI_BASE_URL = process.env.WHATAI_BASE_URL || 'https://api.whatai.cc';
const WHATAI_API_KEY = process.env.WHATAI_API_KEY;
const WHATAI_TEXT_MODEL = process.env.WHATAI_TEXT_MODEL || 'gemini-2.0-flash-exp';
const WHATAI_IMAGE_GENERATION_MODEL = process.env.WHATAI_IMAGE_GENERATION_MODEL || 'qwen-image';
const WHATAI_IMAGE_EDIT_MODEL = process.env.WHATAI_IMAGE_EDIT_MODEL || 'gemini-2.5-flash-image';
const WHATAI_VIDEO_MODEL = process.env.WHATAI_VIDEO_MODEL || 'vidu-1';
const PROXY_VIA_VITE = (process.env.PROXY_VIA_VITE || 'true') === 'true';

const IS_BROWSER = typeof window !== 'undefined';

function isWhataiEnabled(): boolean {
  return Boolean(WHATAI_API_KEY || PROXY_VIA_VITE);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(",");
  const meta = parts[0];
  const base64 = parts[1] ?? parts[0];
  const mimeMatch = /data:(.*?);base64/.exec(meta);
  const mimeType = mimeMatch ? mimeMatch[1] : "application/octet-stream";
  const binary = atob(base64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mimeType });
}

// 计算 base64 图片的长宽比（简化为最简分数），返回形如 "W:H"
async function computeAspectRatioFromBase64(base64: string, mimeType?: string): Promise<string | null> {
  if (!IS_BROWSER) return null;
  try {
    const url = `data:${mimeType || 'image/png'};base64,${base64}`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = url;
    });
    let w = loaded.naturalWidth || loaded.width;
    let h = loaded.naturalHeight || loaded.height;
    if (!w || !h) return null;
    // 化简比例
    const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
    const g = gcd(w, h);
    const ar = `${Math.round(w / g)}:${Math.round(h / g)}`;
    return ar;
  } catch (err) {
    console.warn('计算图片长宽比失败，回退默认:', err);
    return null;
  }
}

// 获取 base64 图片尺寸
async function getBase64ImageSize(base64: string, mimeType?: string): Promise<{ width: number; height: number } | null> {
  if (!IS_BROWSER) return null;
  try {
    const url = `data:${mimeType || 'image/png'};base64,${base64}`;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const loaded = await new Promise<HTMLImageElement>((resolve, reject) => {
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = url;
    });
    const w = loaded.naturalWidth || loaded.width;
    const h = loaded.naturalHeight || loaded.height;
    if (!w || !h) return null;
    return { width: w, height: h };
  } catch (err) {
    console.warn('获取图片尺寸失败:', err);
    return null;
  }
}

// 按比例缩小到不超过 maxWidth/maxHeight（不放大）
async function resizeBase64ToMax(base64: string, mimeType?: string, maxWidth = 2048, maxHeight = 2048): Promise<{ base64: string; width: number; height: number; scale: number } | null> {
  const size = await getBase64ImageSize(base64, mimeType);
  if (!size) return null;
  const { width, height } = size;
  const scale = Math.min(maxWidth / width, maxHeight / height, 1);
  if (scale >= 1) return { base64, width, height, scale: 1 };
  const targetW = Math.max(1, Math.floor(width * scale));
  const targetH = Math.max(1, Math.floor(height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const url = `data:${mimeType || 'image/png'};base64,${base64}`;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = url;
  });
  ctx.drawImage(img, 0, 0, targetW, targetH);
  const out = canvas.toDataURL(mimeType || 'image/png').split(',')[1] || base64;
  return { base64: out, width: targetW, height: targetH, scale };
}

// 按指定因子缩放（用于与基图保持一致比例）
async function scaleBase64ByFactor(base64: string, mimeType: string | undefined, factor: number): Promise<{ base64: string; width: number; height: number } | null> {
  if (factor === 1) {
    const size = await getBase64ImageSize(base64, mimeType);
    if (!size) return { base64, width: 0, height: 0 };
    return { base64, width: size.width, height: size.height };
  }
  const size = await getBase64ImageSize(base64, mimeType);
  if (!size) return null;
  const targetW = Math.max(1, Math.floor(size.width * factor));
  const targetH = Math.max(1, Math.floor(size.height * factor));
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const url = `data:${mimeType || 'image/png'};base64,${base64}`;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.crossOrigin = 'anonymous';
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = url;
  });
  ctx.drawImage(img, 0, 0, targetW, targetH);
  const out = canvas.toDataURL(mimeType || 'image/png').split(',')[1] || base64;
  return { base64: out, width: targetW, height: targetH };
}

// 将返回的图片按目标比例进行信封式适配（不裁剪，仅加透明边框以匹配比例）
async function letterboxToAspectRatio(base64: string, mimeType: string, targetAspectRatio: string): Promise<string> {
  if (!IS_BROWSER) return base64;
  const [twStr, thStr] = targetAspectRatio.split(":");
  const tw = parseInt(twStr, 10);
  const th = parseInt(thStr, 10);
  if (!tw || !th) return base64;

  const url = `data:${mimeType};base64,${base64}`;
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = url;
  });

  const cw = img.naturalWidth || img.width;
  const ch = img.naturalHeight || img.height;
  if (!cw || !ch) return base64;

  const currentRatio = cw / ch;
  const targetRatio = tw / th;

  // 目标画布尺寸以当前较长边为基准，避免放大失真
  let canvasW = cw;
  let canvasH = Math.round(cw / targetRatio);
  if (targetRatio > currentRatio) {
    canvasH = ch;
    canvasW = Math.round(ch * targetRatio);
  }

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) return base64;

  ctx.clearRect(0, 0, canvasW, canvasH);

  // 计算缩放后图像尺寸以在信封内居中
  let drawW = canvasW;
  let drawH = Math.round(drawW / currentRatio);
  if (drawH > canvasH) {
    drawH = canvasH;
    drawW = Math.round(drawH * currentRatio);
  }
  const dx = Math.round((canvasW - drawW) / 2);
  const dy = Math.round((canvasH - drawH) / 2);
  ctx.drawImage(img, dx, dy, drawW, drawH);

  const out = canvas.toDataURL(mimeType).split(',')[1] || base64;
  return out;
}

// whatai.cc 统一 API 调用函数
async function whataiFetch(path: string, init: RequestInit): Promise<Response> {
  const useDevProxy = IS_BROWSER && PROXY_VIA_VITE;
  const url = useDevProxy ? `/proxy-whatai${path}` : `${WHATAI_BASE_URL}${path}`;
  const headers = new Headers(init.headers || {});
  
  if (!useDevProxy && WHATAI_API_KEY) {
    headers.set('Authorization', `Bearer ${WHATAI_API_KEY}`);
  }
  if (!headers.has('Accept')) headers.set('Accept', 'application/json');
  
  // 只有在不是 FormData 时才设置 Content-Type
  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  const finalInit: RequestInit = { ...init, headers };
  const resp = await withRetry(() => fetch(url, finalInit), { retries: 3, baseDelayMs: 800 });
  
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`whatai API Error: ${resp.status} ${resp.statusText} ${text}`);
  }
  
  return resp;
}

// 统一的 OpenAI 格式聊天完成 API
async function whataiChatCompletions(body: any): Promise<any> {
  const resp = await whataiFetch('/v1/chat/completions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  
  const contentType = resp.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await resp.text();
    throw new Error(`whatai returned non-JSON (${contentType}): ${text.substring(0, 200)}`);
  }
  
  return await resp.json();
}

// 统一的 OpenAI 格式图像生成 API
async function whataiImageGeneration(body: any): Promise<any> {
  const resp = await whataiFetch('/v1/images/generations', {
    method: 'POST',
    body: JSON.stringify(body),
  });
  
  const contentType = resp.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await resp.text();
    throw new Error(`whatai returned non-JSON (${contentType}): ${text.substring(0, 200)}`);
  }
  
  return await resp.json();
}

// 统一的 OpenAI 格式图像编辑 API
async function whataiImageEdit(body: any): Promise<any> {
  // 构建 FormData 用于图像编辑
  const formData = new FormData();
  
  // 添加必需的字段
  formData.append('model', body.model);
  formData.append('prompt', body.prompt);
  if (body.aspect_ratio) formData.append('aspect_ratio', body.aspect_ratio);
  if (body.response_format) formData.append('response_format', body.response_format);
  
  // 将 base64 图像转换为 Blob 并添加到 FormData
  if (body.image) {
    const imageBlob = dataUrlToBlob(`data:image/png;base64,${body.image}`);
    formData.append('image', imageBlob, 'image.png');
  }
  
  // 如果有遮罩，也添加到 FormData
  if (body.mask) {
    const maskBlob = dataUrlToBlob(`data:image/png;base64,${body.mask}`);
    formData.append('mask', maskBlob, 'mask.png');
  }
  
  const resp = await whataiFetch('/v1/images/edits', {
    method: 'POST',
    body: formData, // 使用 FormData 而不是 JSON
  });
  
  const contentType = resp.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await resp.text();
    throw new Error(`whatai returned non-JSON (${contentType}): ${text.substring(0, 200)}`);
  }
  
  return await resp.json();
}

type ImageInput = {
  href: string;
  mimeType: string;
};

// 文本生成图像
export async function generateImageFromText(prompt: string): Promise<{ 
  newImageBase64: string | null; 
  newImageMimeType: string | null; 
  textResponse: string | null; 
}> {
  if (!isWhataiEnabled()) {
    return {
      newImageBase64: null,
      newImageMimeType: null,
      textResponse: "whatai API 未配置或未启用"
    };
  }

  try {
    const body = {
      model: WHATAI_IMAGE_GENERATION_MODEL,
      prompt: prompt,
      aspect_ratio: "1:1",
      response_format: "url"
    };

    console.log('发送给图像生成API的请求体:', JSON.stringify(body, null, 2));
    console.log('使用的模型:', WHATAI_IMAGE_GENERATION_MODEL);
    console.log('API端点: /v1/images/generations');
    
    const result = await whataiImageGeneration(body);
    console.log('图像生成API完整响应:', JSON.stringify(result, null, 2));
    
    // 图像生成模型可能返回base64或URL，需要检查响应格式
    if (result.data && result.data[0]) {
      const imageData = result.data[0];
      
      // 检查是否有base64数据
      if (imageData.b64_json) {
        return {
          newImageBase64: imageData.b64_json,
          newImageMimeType: "image/png",
          textResponse: `使用 ${WHATAI_IMAGE_GENERATION_MODEL} 模型成功生成图像`
        };
      }
      
      // 检查是否有URL
      if (imageData.url) {
        try {
          const imageResponse = await fetch(imageData.url);
          const imageBlob = await imageResponse.blob();
          const reader = new FileReader();
          
          return new Promise((resolve) => {
            reader.onload = () => {
              const base64 = (reader.result as string).split(',')[1];
              resolve({
                newImageBase64: base64,
                newImageMimeType: "image/png",
                textResponse: `使用 ${WHATAI_IMAGE_GENERATION_MODEL} 模型成功生成图像`
              });
            };
            reader.readAsDataURL(imageBlob);
          });
        } catch (fetchError) {
          console.error('获取图像URL失败:', fetchError);
          return {
            newImageBase64: null,
            newImageMimeType: null,
            textResponse: `图像获取失败: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`
          };
        }
      }
    }
    
    return {
      newImageBase64: null,
      newImageMimeType: null,
      textResponse: "图像生成失败：API 返回格式异常"
    };
    
  } catch (error) {
    console.error('whatai 图像生成失败:', error);
    return {
      newImageBase64: null,
      newImageMimeType: null,
      textResponse: `图像生成失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// 图像编辑
export async function editImage(
  images: ImageInput[], 
  prompt: string,
  mask?: ImageInput
): Promise<{ 
  newImageBase64: string | null; 
  newImageMimeType: string | null; 
  textResponse: string | null; 
}> {
  if (!isWhataiEnabled()) {
    return {
      newImageBase64: null,
      newImageMimeType: null,
      textResponse: "whatai API 未配置或未启用"
    };
  }

  if (!images || images.length === 0) {
    return {
      newImageBase64: null,
      newImageMimeType: null,
      textResponse: "图像编辑失败：未提供输入图像"
    };
  }

  try {
    // 仅使用首张图作为编辑的基底
    const base = images[0];
    const imageBase64 = base.href.includes('base64,')
      ? base.href.split('base64,')[1]
      : base.href;

    // 计算原图长宽比（用于保持编辑输出比例一致）
    const aspectRatioFromImage = await computeAspectRatioFromBase64(imageBase64, base.mimeType);

    // 若输入图片超过 2048×2048，则先按比例缩小到限制内
    let preparedImageBase64 = imageBase64;
    let preparedMaskBase64 = mask ? (mask.href.includes('base64,') ? mask.href.split('base64,')[1] : mask.href) : undefined;
    const resized = await resizeBase64ToMax(imageBase64, base.mimeType, 2048, 2048);
    if (resized && resized.scale < 1) {
      preparedImageBase64 = resized.base64;
      if (preparedMaskBase64) {
        const maskScaled = await scaleBase64ByFactor(preparedMaskBase64, mask?.mimeType, resized.scale);
        preparedMaskBase64 = maskScaled?.base64 ?? preparedMaskBase64;
      }
      console.debug('[editImage] 输入图过大，已按比例缩放', {
        original: await getBase64ImageSize(imageBase64, base.mimeType),
        resized: { width: resized.width, height: resized.height },
        scale: resized.scale,
      });
    }

    // 有遮罩 → 使用编辑接口；无遮罩 → 使用生成接口（qwen-image 支持 aspect_ratio 更稳定）
    if (mask) {
      const body: any = {
        model: WHATAI_IMAGE_EDIT_MODEL,
        prompt: prompt,
        ...(aspectRatioFromImage ? { aspect_ratio: aspectRatioFromImage } : {}),
        response_format: "url",
        image: preparedImageBase64,
        mask: preparedMaskBase64
      };

      console.log('[editImage] 路径: edits（含遮罩） /v1/images/edits', {
        model: WHATAI_IMAGE_EDIT_MODEL,
        aspect_ratio: aspectRatioFromImage || '未提供',
        response_format: body.response_format
      });

      var result = await whataiImageEdit(body);
    } else {
      const body: any = {
        model: WHATAI_IMAGE_GENERATION_MODEL,
        prompt: prompt,
        ...(aspectRatioFromImage ? { aspect_ratio: aspectRatioFromImage } : {}),
        response_format: "url",
        image: [preparedImageBase64]
      };

      console.log('[editImage] 路径: generations（无遮罩） /v1/images/generations', {
        model: WHATAI_IMAGE_GENERATION_MODEL,
        aspect_ratio: aspectRatioFromImage || '未提供',
        response_format: body.response_format
      });

      var result = await whataiImageGeneration(body);
    }
    
    if (result.data && result.data[0]) {
      const imageData = result.data[0];
      if (imageData.b64_json) {
        let b64 = imageData.b64_json;
        const mime = "image/png";
        // 若服务端未按原始比例输出，则进行信封适配为原始比例
        if (aspectRatioFromImage) {
          const outAr = await computeAspectRatioFromBase64(b64, mime);
          if (outAr && outAr !== aspectRatioFromImage) {
            b64 = await letterboxToAspectRatio(b64, mime, aspectRatioFromImage);
            console.log('[editImage] 服务端输出比例与原图不一致，已用信封适配到目标比例:', { target: aspectRatioFromImage, actual: outAr });
          }
        }
        return {
          newImageBase64: b64,
          newImageMimeType: mime,
          textResponse: `使用 ${WHATAI_IMAGE_EDIT_MODEL} 模型成功编辑图像`
        };
      }
      if (imageData.url) {
        try {
          const imageResponse = await fetch(imageData.url);
          const imageBlob = await imageResponse.blob();
          const reader = new FileReader();
          return new Promise((resolve) => {
            reader.onload = async () => {
              let base64 = (reader.result as string).split(',')[1];
              const mime = "image/png";
              if (aspectRatioFromImage) {
                const outAr = await computeAspectRatioFromBase64(base64, mime);
                if (outAr && outAr !== aspectRatioFromImage) {
                  base64 = await letterboxToAspectRatio(base64, mime, aspectRatioFromImage);
                  console.log('[editImage] URL输出比例与原图不一致，已用信封适配到目标比例:', { target: aspectRatioFromImage, actual: outAr });
                }
              }
              resolve({
                newImageBase64: base64,
                newImageMimeType: mime,
                textResponse: `使用 ${WHATAI_IMAGE_EDIT_MODEL} 模型成功编辑图像`
              });
            };
            reader.readAsDataURL(imageBlob);
          });
        } catch (fetchError) {
          console.error('获取编辑图像URL失败:', fetchError);
          return {
            newImageBase64: null,
            newImageMimeType: null,
            textResponse: `图像获取失败: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`
          };
        }
      }
    }
    
    return {
      newImageBase64: null,
      newImageMimeType: null,
      textResponse: "图像编辑失败：API 返回格式异常"
    };
    
  } catch (error) {
    console.error('whatai 图像编辑失败:', error);
    return {
      newImageBase64: null,
      newImageMimeType: null,
      textResponse: `图像编辑失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

// 视频生成
export async function generateVideo(
  prompt: string,
  aspectRatio: '16:9' | '9:16',
  onProgress: (message: string) => void,
  image?: ImageInput
): Promise<{ videoBlob: Blob; mimeType: string }> {
  if (!isWhataiEnabled()) {
    throw new Error("whatai API 未配置或未启用");
  }

  try {
    onProgress("正在使用 whatai 统一 API 生成视频...");

    const body: any = {
      model: WHATAI_VIDEO_MODEL,
      prompt: prompt,
      aspect_ratio: aspectRatio,
      duration: 5 // 默认 5 秒
    };

    // 如果提供了参考图像
    if (image) {
      const imageBase64 = image.href.includes('base64,') 
        ? image.href.split('base64,')[1] 
        : image.href;
      body.image = imageBase64;
    }

    onProgress("正在发送视频生成请求...");
    
    // 使用聊天完成 API 进行视频生成
    const result = await whataiChatCompletions({
      model: WHATAI_VIDEO_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `生成视频：${prompt}，宽高比：${aspectRatio}` },
            ...(image ? [{ 
              type: "image_url", 
              image_url: { url: image.href } 
            }] : [])
          ]
        }
      ],
      max_tokens: 1000
    });

    onProgress("视频生成完成，正在处理结果...");

    // 这里需要根据实际的 whatai 视频生成 API 响应格式进行调整
    if (result.choices && result.choices[0] && result.choices[0].message) {
      const content = result.choices[0].message.content;
      
      // 假设返回的是视频的 base64 数据或 URL
      if (content.includes('data:video/') || content.includes('http')) {
        const videoData = content.includes('data:video/') 
          ? content 
          : await fetch(content).then(r => r.blob());
        
        const blob = typeof videoData === 'string' 
          ? dataUrlToBlob(videoData)
          : videoData;
        
        return {
          videoBlob: blob,
          mimeType: "video/mp4"
        };
      }
    }

    throw new Error("视频生成失败：API 返回格式异常");
    
  } catch (error) {
    console.error('whatai 视频生成失败:', error);
    throw new Error(`视频生成失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 文本生成（聊天完成）
export async function generateText(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  if (!isWhataiEnabled()) {
    throw new Error("whatai API 未配置或未启用");
  }

  try {
    const messages: any[] = [];
    
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    
    messages.push({ role: "user", content: prompt });

    const body = {
      model: WHATAI_TEXT_MODEL,
      messages: messages,
      max_tokens: 2000,
      temperature: 0.7
    };

    const result = await whataiChatCompletions(body);
    
    if (result.choices && result.choices[0] && result.choices[0].message) {
      return result.choices[0].message.content;
    }
    
    throw new Error("文本生成失败：API 返回格式异常");
    
  } catch (error) {
    console.error('whatai 文本生成失败:', error);
    throw new Error(`文本生成失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}
