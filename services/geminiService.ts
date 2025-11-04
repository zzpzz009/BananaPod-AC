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
    // 将图像转换为 base64 内容（不含 dataURL 前缀）
    const imageBase64 = images[0].href.includes('base64,')
      ? images[0].href.split('base64,')[1]
      : images[0].href;

    // 根据 Nano-banana 文档：编辑同样走 /v1/images/generations，使用 JSON，并传 image 数组
    const body: any = {
      model: WHATAI_IMAGE_EDIT_MODEL,
      prompt: prompt,
      aspect_ratio: "1:1",
      response_format: "url",
      image: [imageBase64]
    };

    const result = await whataiImageGeneration(body);
    
    if (result.data && result.data[0]) {
      const imageData = result.data[0];
      if (imageData.b64_json) {
        return {
          newImageBase64: imageData.b64_json,
          newImageMimeType: "image/png",
          textResponse: `使用 ${WHATAI_IMAGE_EDIT_MODEL} 模型成功编辑图像`
        };
      }
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
