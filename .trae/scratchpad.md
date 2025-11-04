# BananaPod 项目状态记录

## 背景和动机
用户要求按照 `https://docs.whatai.cc/docs/openai/syfw/#api-%E7%BB%9F%E4%B8%80%E8%AF%B7%E6%B1%82%E6%A0%BC%E5%BC%8F` 教程重新调用三方API，放弃现有三方调用方式。

## 关键挑战和分析
1. 原有系统使用多种API调用方式（Gemini SDK、代理、whatai），需要统一为whatai.cc的OpenAI格式API
2. 需要重构geminiService.ts以适配新的API格式
3. 需要更新环境配置和代理设置
4. 确保图像生成、编辑、文本生成和视频生成功能正常工作

## 高层任务拆分
1. ✅ 分析现有三方API调用实现
2. ✅ 研究whatai.cc文档和API格式
3. ✅ 重构geminiService.ts以使用whatai.cc统一OpenAI格式API
4. ✅ 更新.env.local配置以适配新的whatai.cc API调用方式
5. ✅ 更新vite.config.ts代理配置
6. 🔄 测试新的API集成并验证图像生成和编辑功能
7. ✅ 在图层面板新增“合并图层为图片”操作并实现逻辑

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

**执行者模式** - 正在测试新的API集成

已完成的工作：
1. 完全重构了geminiService.ts，移除了Gemini SDK和旧的代理实现
2. 实现了统一的whatai.cc OpenAI格式API调用
3. 更新了环境配置文件.env.local
4. 更新了vite.config.ts的代理配置
5. 开发服务器已启动，预览页面可正常访问

当前正在进行：
- 测试新的API集成功能
- 本地验证“合并图层为图片”功能（selected 或 visible 模式）

**执行者新增变更（图层合并功能）：**
- 在 `components/LayerPanel.tsx` 与 `src/components/LayerPanel.tsx` 增加 `onMergeLayers` 回调与“合并图层”按钮（未选中则合并可见图层）
- 在 `App.tsx` 实现 `handleMergeLayers(mode)`：
  - 收集选中元素（及组内后代）或所有可见元素
  - 过滤掉组与视频元素，调用 `flattenElementsToImage` 栅格化为单张 PNG
  - 使用 `commitAction` 替换原图层为新 `ImageElement`
- 在 `App.tsx` 传入 `onMergeLayers={handleMergeLayers}` 以接线层面板按钮
- 启动 Vite 开发服务器并打开预览进行手动验证

**验证步骤（请按此回归测试）：**
1. 在画布添加若干元素（路径、形状、文本、图片），或使用现有演示内容。
2. 打开“Layers”面板，选择多个图层，点击“合并图层”。
   - 若未选择，点击将合并所有可见图层。
3. 期望结果：原选中/可见图层被移除，出现一张新的图片元素（名称“Merged Image”），位置与尺寸匹配合并后的边界。
4. 撤销/重做应正确工作，合并后图片可下载、移动、缩放。

若遇到错误，请将提示与控制台日志发回：
- 错误信息形如：`合并图层失败：<message>`，并在控制台输出堆栈。

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