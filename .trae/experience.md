# BananaPod 经验与教训

## GitHub 认证与推送
- 经典 PAT（`ghp_...`）需启用完整 `repo` 权限才能创建与推送私有仓库；精细令牌需在“个人账户”范围授予“创建仓库”与 `Contents: Read & Write`，否则调用 v3 API 返回 `401 Unauthorized`。
- 推送时避免在远程 URL 中嵌入令牌；优先使用 `git -c "http.extraHeader=Authorization: Basic <base64(username:PAT)>" push` 临时注入认证头，推送完成后保持 `origin` 为纯 HTTPS。
- PowerShell 中对 `git` 的错误需要检查 `$LASTEXITCODE` 或解析标准输出/错误；`try/catch` 对非终止错误无法捕获，可能出现“失败但日志显示成功”的假象。
- 将令牌存放在 `.trae/githubPAT` 并通过 `.trae/.gitignore` 忽略，避免误提交与泄露。
- Windows 行尾：`CRLF/LF` 提示属正常；可在 `.gitattributes` 统一行尾，或设置 `core.autocrlf=true` 以减少提示。

## 打包与桌面应用（Electron）
- `electron-builder` 要求 `package.json.name` 使用规范 ASCII 名称（不支持 emoji/特殊符号）；可通过 `productName` 设置展示名。
- Vite 在 Electron 生产态需将 `base` 设为 `'./'`，否则 `file://` 协议下静态资源路径会指向根盘导致加载失败。
- `public/` 目录资源在组件中不要用绝对路径 `"/..."` 引用；改为 `${import.meta.env.BASE_URL}path` 或封装辅助函数，确保在 dev (`/`) 与 Electron (`./`) 两种 base 下均能正确解析。
- Windows 单文件建议使用 `portable` 目标，生成 `*.portable.exe`，便于分发与免安装使用。
- 若需要代码签名，需配置证书并启用 `win.certificateSubjectName` 或 `win.sign`；本次便携版未签名也可运行。
- 当 `package.json` 为 `type: "module"` 时：Electron 主进程若使用 `require`，需将入口文件改名为 `.cjs` 或改写为 ESM `import`；否则会出现“require is not defined in ES module scope”。同时确保打包写入的 `extraMetadata.main` 与 `main` 一致。

## 开发与调试
- 执行前先读取并核对目标文件内容（如 `.trae/scratchpad.md`），再进行编辑，保持文档结构一致。
- 所有外部调用输出需包含调试信息（状态码、错误消息、关键参数），便于快速定位问题。
- 网络错误（如 `Recv failure: Connection was reset`）需与认证错误区分；优先验证令牌权限与有效性，再排查网络或代理。

## UI 改动经验
- 透明度与不透明度：界面以 0–100 输入更直观，渲染与导出时需转换为 0–1（浮点），统一在 `<image>` 与 SVG 字符串中写入。
- 保兼容旧字段：替换工具栏功能时，保留既有 `borderRadius` 的渲染逻辑，避免破坏历史内容。
- 预览强校验：涉及视觉改动必须先启动本地服务器并打开预览页面验证实际效果与错误日志。