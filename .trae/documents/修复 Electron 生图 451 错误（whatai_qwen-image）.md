## 结论与原因假设
- 错误为 451/WAF 拦截，返回 HTML 而非 JSON；触发点在 `whataiFetch` 校验（services/geminiService.ts:254–257）。
- 线索显示使用 `qwen-image`（vite.config.ts:37），该服务端在不同 UA/Origin/Referer 下可能更严格；Electron 与浏览器的网络特征不同，易触发拦截。
- 用户要求“请求体保持当前模式不修改”，因此不改动 `response_format`、字段结构及 body 构造。

## 不改请求体的修复方案
1. Electron/Node 环境请求头兼容：
   - 在 `whataiFetch` 为 Electron/Node 环境追加：
     - `User-Agent`：标准 Chrome UA（避免 Electron UA 触发 WAF）
     - `Referer: https://api.whatai.cc`
     - 保留现有 `Authorization`/`Accept` 逻辑（services/geminiService.ts:235–260）。
2. 代理与端口一致性：
   - 开发模式确保 Electron 加载当前 Vite 端口（3001），避免跨端口导致代理不可用：
     - 更新 `npm run start:electron` 或在 `electron/main.cjs`（electron/main.cjs:17–25）检测端口回退到 3001。
   - 生产/打包模式下仍直接访问 API（不依赖 Vite 代理）。
3. 错误可观测性（不改 body）：
   - 非 JSON 响应分支：
     - 提取并打印 `traceid`/时间/URL（若存在），用于定位 WAF拦截。
     - 打印最终请求 URL 与是否使用代理（`useDevProxy`），便于区分 Electron 直连/代理路径（services/geminiService.ts:235–260）。
4. （可选）模型选择策略（不改 body 结构）：
   - 通过环境变量切换模型以规避供应商侧限制（不修改代码中的 body 字段）：
     - 保持请求体字段不变，仅调整 `process.env.WHATAI_IMAGE_*_MODEL` 值（vite.config.ts:37–39 支持覆盖）。

## 实施步骤
- 在 `whataiFetch` 增加 UA/Referer（仅 Electron/Node）：保持现有 headers 结构与 body 不变。
- 调整 Electron 开发启动端口一致性（3001），或在主进程中容错自动回退。
- 增强非 JSON 响应日志，输出 traceid/URL/代理标记（不影响请求体）。
- 如需切换模型，通过环境变量或 `vite.config.ts` 的 define 覆盖值，避免改动 body 构造。

## 验证
- 在 Electron 与浏览器下分别执行生图与编辑，确认不再出现 451；若出现，查看日志中的 traceid 与请求头/代理标记。
- 保证请求体结构及字段未变（`response_format`、`prompt`、`model` 由环境控制，但构造方式不改）。

## 代码参考
- 校验与错误抛出：services/geminiService.ts:254–257
- 代理配置与模型默认：vite.config.ts:13–30, 37–39
- Electron 加载开发地址：electron/main.cjs:17–25