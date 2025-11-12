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

- style(ui): 更新UI风格，换为黄灰配色，并优化UI细节，更精致细腻
## v0.3.1

- 默认描边颜色改为红色（RGB 255,0,0 / `#FF0000`），新创建的线条、箭头、形状使用该默认色。
- 工具栏颜色选择器改为圆形，并统一为紧凑尺寸 `w-7 h-7`，视觉更一致。
- 新增 `.pod-color-swatch-circle` 样式，移除浏览器默认边框并强制圆形显示（WebKit/Gecko）。
- 统一原生 `range` 滑杆强调色使用主题强调色（`accent-color: var(--text-accent)`），配合 PodUI 主题为黄色。
- 预览检查通过，终端无新增错误。

## v0.4.0 (2025-11-09)

- feat(models): 图像生成与编辑模型统一切换为 `nano-banana`，生成走 `/v1/images/generations`（JSON），编辑走 `/v1/images/edits`（FormData）
- feat(images): 生成接口支持多图参考数组 `image[]`；比例以“图1”计算并传入 `aspect_ratio`
- feat(size-check): 生成接口移除 `size` 传参以符合规范；客户端保留严格尺寸校验与“固定尺寸信封适配”保障输出与首图一致
- chore(logs): 控制台日志统一标注 `(Nano-banana)` 便于调试与核验请求/响应
- chore(version): `package.json` 从 `0.3.1` 升级到 `0.4.0` 并打标签

验证说明：
- 多选图片进行“生成编辑”，查看控制台 `[generations]` 与 `[editImage]` 日志，确认模型与端点、`aspect_ratio`、`image[]` 等参数正确；输出尺寸/比例与“图1”一致（严格模式下不一致将报错）
## v0.5.1 (2025-11-12)

- chore(version): `package.json` 版本升级为 `0.5.1`
- style(ui): 调整香蕉按钮的悬浮面板（Hover Panel）布局与排列，优化分组与间距，提升可读性与可点击性
- docs(changelog): 使用中文补充本次 UI 变更说明，便于团队协作与回溯

验证说明：
- 打开页面，鼠标悬停在香蕉按钮，查看悬浮面板布局与按钮排列是否更紧凑、分组更清晰；并确认点击热区无回归问题