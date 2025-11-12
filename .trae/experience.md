# BananaPod 经验与教训

## GitHub 认证与推送
- 经典 PAT（`ghp_...`）需启用完整 `repo` 权限才能创建与推送私有仓库；精细令牌需在“个人账户”范围授予“创建仓库”与 `Contents: Read & Write`，否则调用 v3 API 返回 `401 Unauthorized`。
- 推送时避免在远程 URL 中嵌入令牌；优先使用 `git -c "http.extraHeader=Authorization: Basic <base64(username:PAT)>" push` 临时注入认证头，推送完成后保持 `origin` 为纯 HTTPS。
- PowerShell 中对 `git` 的错误需要检查 `$LASTEXITCODE` 或解析标准输出/错误；`try/catch` 对非终止错误无法捕获，可能出现“失败但日志显示成功”的假象。
- 将令牌存放在 `.trae/githubPAT` 并通过 `.trae/.gitignore` 忽略，避免误提交与泄露。

## 开发与调试
- 执行前先读取并核对目标文件内容（如 `.trae/scratchpad.md`），再进行编辑，保持文档结构一致。
- 所有外部调用输出需包含调试信息（状态码、错误消息、关键参数），便于快速定位问题。
- 网络错误（如 `Recv failure: Connection was reset`）需与认证错误区分；优先验证令牌权限与有效性，再排查网络或代理。

## UI 改动经验
- 透明度与不透明度：界面以 0–100 输入更直观，渲染与导出时需转换为 0–1（浮点），统一在 `<image>` 与 SVG 字符串中写入。
- 保兼容旧字段：替换工具栏功能时，保留既有 `borderRadius` 的渲染逻辑，避免破坏历史内容。
- 预览强校验：涉及视觉改动必须先启动本地服务器并打开预览页面验证实际效果与错误日志。