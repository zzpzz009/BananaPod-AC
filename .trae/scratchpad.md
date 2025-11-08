# BananaPod 项目状态记录

## 背景和动机
用户要求：在保持现有布局不变的前提下，替换当前UI风格为 PodUI（来源：`f:\Trae\BananaPod\PodUI.html`），尤其是颜色配色与UI元素使用，确保所有按钮与功能保持可用。

同时保留既有API集成重构任务背景：按照 `https://docs.whatai.cc/docs/openai/syfw/#api-%E7%BB%9F%E4%B8%80%E8%AF%B7%E6%B1%82%E6%A0%BC%E5%BC%8F` 教程统一三方API调用。

## 关键挑战和分析
1. 原有系统使用多种API调用方式（Gemini SDK、代理、whatai），需要统一为whatai.cc的OpenAI格式API
2. 需要重构geminiService.ts以适配新的API格式
3. 需要更新环境配置和代理设置
4. 确保图像生成、编辑、文本生成和视频生成功能正常工作
5. PodUI 与现有代码广泛使用的 Tailwind 工具类存在风格差异；在不改布局的前提下，需要通过新增全局样式与有限的类名替换来实现 PodUI 的视觉一致性。
6. 避免一次性大改：优先以 CSS 变量与通用类（如 pod-panel、pod-icon-button）覆盖视觉；逐步替换关键组件按钮与面板类名，功能逻辑保持不变。

## 高层任务拆分
1. ✅ 分析现有三方API调用实现
2. ✅ 研究whatai.cc文档和API格式
3. ✅ 重构geminiService.ts以使用whatai.cc统一OpenAI格式API
4. ✅ 更新.env.local配置以适配新的whatai.cc API调用方式
5. ✅ 更新vite.config.ts代理配置
6. 🔄 测试新的API集成并验证图像生成和编辑功能
7. ✅ 在图层面板新增“合并图层为图片”操作并实现逻辑
8. 🔄 引入 PodUI 主题：新增 `src/styles/podui.css`，定义颜色变量与通用UI类
9. 🔄 在 `index.tsx` 引入 PodUI 样式，并在 `App.tsx` 顶层容器加 `podui-theme` 类
10. 🔄 将 PromptBar、Toolbar、CanvasSettings、BoardPanel、QuickPrompts 的按钮与面板样式替换为 PodUI 类（不改布局与逻辑）
11. 🔄 调整 LayerPanel 列表项的选中与悬浮态为 PodUI 风格
12. 🔄 启动开发服务并打开预览，核验颜色配色与交互可用性；若需，逐步微调类名与样式

## 项目状态看板
- [x] 重构geminiService.ts以使用whatai.cc的统一OpenAI格式API
- [x] 更新.env.local配置以适配新的whatai.cc API调用方式
- [x] 更新vite.config.ts代理配置，移除不需要的proxy-openai
- [ ] 测试图像生成功能（文本转图像）
- [ ] 测试图像编辑功能
- [ ] 测试文本生成功能
- [ ] 测试视频生成功能
- [ ] 验证所有功能正常工作
 - [x] 在图层面板添加并验证“合并图层”按钮显示
 - [x] 后端逻辑：将选中/可见图层栅格化并替换为单张图片
 - [x] 发布版本 v0.1.0（新增“合并图层为图片”，修复元素栅格边界计算）
 
### PodUI 主题集成（新）
- [ ] 新增 `src/styles/podui.css` 并引入到 `index.tsx`
- [ ] 顶层容器应用 `podui-theme` 类
- [ ] PromptBar 使用 PodUI 按钮与输入样式
- [ ] CanvasSettings/BoardPanel 使用 PodUI 面板与按钮
- [ ] Toolbar/QuickPrompts 使用 PodUI 按钮与菜单项
- [ ] LayerPanel 列表项选中与悬浮态改为 PodUI 风格
- [ ] 打开预览验证并记录问题与调试信息

## 当前状态/进度跟踪

### 项目状态看板
- [x] 修复图像编辑API的multipart form格式问题
- [x] 将图像编辑模型更改为gemini-2.5-flash-image
- [x] 分离图像生成和编辑模型配置
- [x] 将图像生成模型更改为qwen-image
- [x] 重启服务器应用新配置
- [x] 修复qwen-image模型"image response is null"错误
- [ ] 验证图像生成功能（qwen-image模型）
- [ ] 验证图像编辑功能（gemini-2.5-flash-image模型）
- [ ] 验证其他功能（文本生成、视频生成等）

**执行者模式** - 正在测试新的API集成（长宽比修复已上线）

（新增）**执行者模式 - PodUI 集成第一步**
- 计划：以最小改动方式引入 PodUI 变量与通用类，逐步替换关键组件的按钮与面板类名；保持所有功能与交互逻辑不变。
- 验证标准：
  - 保持页面与面板位置、布局结构不变；
  - 颜色体系、按钮风格、面板视觉与 `PodUI.html` 一致；
  - 所有按钮可点击、文件上传、生成与编辑、图层操作等均正常；
  - 打开预览无报错，必要时增加调试日志。

已完成的工作：
1. 完全重构了geminiService.ts，移除了Gemini SDK和旧的代理实现
2. 实现了统一的whatai.cc OpenAI格式API调用
3. 更新了环境配置文件.env.local
4. 更新了vite.config.ts的代理配置
5. 开发服务器已启动，预览页面可正常访问

当前正在进行：
- 测试新的API集成功能
- 本地验证“合并图层为图片”功能（selected 或 visible 模式）
- 验证图像编辑输出长宽比与原图一致（已切换到 /v1/images/edits 接口，传递 aspect_ratio）

**环境配置更新（2025-11-05）**
- 写入 `.env.local`：`WHATAI_API_KEY` 已配置，`PROXY_VIA_VITE=true`
- 更新 `.gitignore`：添加 `.env*`，防止密钥被提交到仓库
- 重启开发服务器以加载环境变量

**本次修复（2025-11-05）**
- 将 `editImage` 改为调用 `/v1/images/edits`（multipart/form-data），支持可选 `mask`
- 动态计算并传入 `aspect_ratio`，来源于原始图片的自然宽高（最简分数形式，如 `4:3`）
- 增加调试日志：在控制台输出接口类型、`aspect_ratio` 值、是否传入 `mask`

**执行者新增变更（图层合并功能）：**
- 在 `components/LayerPanel.tsx` 与 `src/components/LayerPanel.tsx` 增加 `onMergeLayers` 回调与“合并图层”按钮（未选中则合并可见图层）
- 在 `App.tsx` 实现 `handleMergeLayers(mode)`：
  - 收集选中元素（及组内后代）或所有可见元素
  - 过滤掉组与视频元素，调用 `flattenElementsToImage` 栅格化为单张 PNG
  - 使用 `commitAction` 替换原图层为新 `ImageElement`
- 在 `App.tsx` 传入 `onMergeLayers={handleMergeLayers}` 以接线层面板按钮
- 启动 Vite 开发服务器并打开预览进行手动验证
 - 已完成版本升级：package.json 从 0.0.0 → 0.1.0，新增 CHANGELOG.md，创建 Git 标签 v0.1.0

**发布记录**
- 版本：v0.1.0
- 内容：
  - 新增图层合并为图片功能（LayerPanel 按钮与回调）
  - 修复 flattenElementsToImage 依赖 elementsRef 导致的运行时错误
  - 更新版本号与变更日志，创建标签 v0.1.0

- 版本：v0.2.0
- 内容：
  - 输入图自动按原图比例缩小至不超过 2048×2048（不放大、不裁剪）
  - 有遮罩时同步按比例缩放遮罩，保持与基图坐标一致
  - 编辑与生成分别调用 `/v1/images/edits` 与 `/v1/images/generations`，传入原图 `aspect_ratio`
  - 若服务端返回比例不一致，前端以透明边框进行信封式适配到目标比例
  - 环境：设置 `WHATAI_API_KEY` 与 `PROXY_VIA_VITE=true`，在 `.gitignore` 增加 `.env*`
  - 版本：将 `package.json` 从 0.1.0 升级到 0.2.0，对应 CHANGELOG.md 记录

**验证步骤（请按此回归测试）：**
1. 在画布添加若干元素（路径、形状、文本、图片），或使用现有演示内容。
2. 打开“Layers”面板，选择多个图层，点击“合并图层”。
   - 若未选择，点击将合并所有可见图层。
3. 期望结果：原选中/可见图层被移除，出现一张新的图片元素（名称“Merged Image”），位置与尺寸匹配合并后的边界。
4. 撤销/重做应正确工作，合并后图片可下载、移动、缩放。

若遇到错误，请将提示与控制台日志发回：
- 错误信息形如：`合并图层失败：<message>`，并在控制台输出堆栈。

**附加验证（编辑输出长宽比）：**
1. 方式A（无文件上传即可）：选择一个非正方形的形状（如矩形或宽条路径），在提示栏输入“将此形状转换为照片风格”，点击“生成”。
   - 预期：生成的新图片宽高比与选中形状的外接矩形一致（例如 2:1 或 4:3），非 1:1。
2. 方式B（有原图）：上传一张非 1:1 的图片（如 4:3），选中后在提示栏输入任意编辑提示并生成。
   - 预期：编辑后的输出图片保持与原图一致的宽高比（4:3）。
3. 打开浏览器控制台（F12），可看到如下调试日志：
   - `[editImage] 使用编辑接口 /v1/images/edits { model, aspect_ratio, hasMask, response_format }`
   - 若 `aspect_ratio` 显示为非 `1:1`，说明传参正确、服务端已收到。

若仍出现 1:1，请记录：
- 控制台完整日志（含 `editImage` 打印）
- 你使用的原图分辨率与显示宽高
- 操作路径（是否有 `mask`）

**新增规则与验证（输入图自动缩放 ≤2048×2048）：**
- 需求：若输入图片分辨率任一边超过 `2048`，编辑前自动按原图比例缩小至不超过 `2048×2048`（不放大、不裁剪）。
- 实现位置：`services/geminiService.ts`
  - 新增 `getBase64ImageSize` 读取 base64 尺寸。
  - 新增 `resizeBase64ToMax(base64, mime, 2048, 2048)`，返回缩放后 `base64/width/height/scale`。
  - 新增 `scaleBase64ByFactor(base64, mime, factor)`，用于遮罩与基图同步缩放。
  - 在 `editImage` 中：
    - 对首张基图计算 `scale = min(2048/width, 2048/height, 1)`，若 `< 1` 则缩放基图；
    - 若存在 `mask`，按同一 `scale` 同步缩放遮罩；
    - 控制台打印 `[editImage] 输入图过大，已按比例缩放 { original, resized, scale }`。
- 验证方法：
  1. 上传一张大图（例如 `5000×3000` → 比例 `5:3`），执行编辑或生成。
  2. 预期：服务端接收的基图已缩小到不超过 `2048×2048`，比例保持 `5:3`；有遮罩时遮罩与基图对齐。
  3. 控制台应出现缩放日志；输出图宽高比应与原图一致（若服务端未严格保持比例，前端将进行透明边框信封式适配）。

## 执行者反馈或请求帮助

**[执行者报告 - 2024年12月]**

✅ **qwen-image模型完整修复完成**

**第一轮修复：**
- 问题：qwen-image模型不支持`response_format: "b64_json"`
- 解决：修改为`"url"`格式，实现URL到base64转换

**第二轮修复（基于OpenAPI规范）：**
- 问题：根据用户提供的OpenAPI规范，qwen-image有特定参数要求
- 解决方案：
  1. 移除不支持的参数：`n`, `size`, `response_format`
  2. 添加支持的参数：`aspect_ratio: "1:1"`
  3. 增强响应处理：支持both `b64_json` and `url`格式

**第三轮修复（代理配置）：**
- 问题：vite代理强制覆盖Content-Type导致请求失败
- 解决：移除代理中强制设置Content-Type的部分

**技术实现详情：**
```typescript
// 修改后的请求参数
const body = {
  model: WHATAI_IMAGE_GENERATION_MODEL,
  prompt: prompt,
  aspect_ratio: "1:1"  // 使用aspect_ratio替代size
  // 移除了n, size, response_format参数
};

// 增强的响应处理
const imageData = result.data[0];
if (imageData.b64_json) {
  return { newImageBase64: imageData.b64_json, ... };
} else if (imageData.url) {
  // URL到base64转换逻辑
}
```

**当前状态：**
- ✅ 模型分离完成（图像生成使用qwen-image，图像编辑使用gemini-2.5-flash-image）
- ✅ 环境配置更新完成（.env.local, vite.config.ts, geminiService.ts）
- ✅ qwen-image模型参数修复完成（基于OpenAPI规范）
- ✅ 代理配置修复完成（移除强制Content-Type设置）
- ✅ 开发服务器重启完成
- ✅ 预览页面打开成功，无浏览器错误

**请求验证：**
请测试以下功能：
1. 图像生成功能（使用qwen-image模型）
2. 图像编辑功能（使用gemini-2.5-flash-image模型）
3. 其他功能（文本生成、视频生成等）