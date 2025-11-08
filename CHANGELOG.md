## v0.1.0 (2025-11-04)

- feat(layer-panel): 新增“合并图层为图片”按钮与回调，支持将选中或可见图层栅格化为单个图片元素，并写入历史以支持撤销/重做
- fix(rasterization): 移除 `flattenElementsToImage` 对组件内部 `elementsRef` 的依赖，修复 `ReferenceError: elementsRef is not defined`
- chore(version): 将 `package.json` 版本从 `0.0.0` 升级到 `0.1.0`

验证说明：
- 在画布添加若干非视频元素，打开图层面板，选择图层点击“合并图层”按钮
- 预期：原图层移除，生成一个新的 `ImageElement`（Merged Image），支持撤销/重做
- 注意：组会自动展开参与合并；视频元素不参与合并
## v0.2.0 (2025-11-05)

- feat(image-edit): 输入图任意边超过 `2048` 时，自动按原图比例缩小至不超过 `2048×2048`，不放大、不裁剪
- feat(mask-scale): 同步缩放遮罩，确保与缩放后的基图坐标一致
- fix(aspect-ratio): 编辑与生成分别调用 `/v1/images/edits` 与 `/v1/images/generations`，按原图比例传参，提升非 1:1 输出稳定性
- fix(letterbox-fallback): 若服务端返回比例与原图不一致，前端以透明边框进行信封式适配到目标比例
- chore(env): 新增并使用 `WHATAI_API_KEY` 与 `PROXY_VIA_VITE=true`；在 `.gitignore` 增加 `.env*` 防止提交密钥
- chore(version): 将 `package.json` 版本从 `0.1.0` 升级到 `0.2.0`

验证说明：
- 上传大图（如 `5000×3000`，比例 `5:3`）进行编辑或生成，控制台应打印缩放日志；服务端接收的基图不超过 `2048×2048`，输出宽高比与原图一致；有遮罩时与基图对齐

## v0.3.0 (2025-11-08)

- style(ui-outline): 新增 `pod-elevated-outline` 提升内圈高光亮度，塑造更清晰的描边层次
- style(ui-gradient): 新增 `pod-bar-soft-gradient`，为 bar 添加极弱的垂直亮暗过渡
- style(ui-inner-ring): 新增 `pod-inner-gradient-ring`，仅在内缘渲染纵向渐变细环；在 `PromptBar` 上应用并将厚度设为 `--pod-ring-width: 1px`
- fix(toolbar-shape): 移除 `Toolbar` 的内圈伪元素，恢复原先的胶囊形状
- chore(bg): 移除所有径向/渐变背景，顶层容器改为纯灰底色，新增 `pod-solid-gray` 并应用于 `App` 顶层
- chore(version): 将 `package.json` 版本从 `0.2.0` 升级到 `0.3.0`

验证说明：
- 访问页面顶部与底部两个 bar：应看到更亮的内圈描边层次；`Toolbar` 保持圆角胶囊外形；`PromptBar` 的内圈细环更窄（约 1px）且有纵向渐变；整体背景为纯灰。