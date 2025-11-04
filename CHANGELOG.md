## v0.1.0 (2025-11-04)

- feat(layer-panel): 新增“合并图层为图片”按钮与回调，支持将选中或可见图层栅格化为单个图片元素，并写入历史以支持撤销/重做
- fix(rasterization): 移除 `flattenElementsToImage` 对组件内部 `elementsRef` 的依赖，修复 `ReferenceError: elementsRef is not defined`
- chore(version): 将 `package.json` 版本从 `0.0.0` 升级到 `0.1.0`

验证说明：
- 在画布添加若干非视频元素，打开图层面板，选择图层点击“合并图层”按钮
- 预期：原图层移除，生成一个新的 `ImageElement`（Merged Image），支持撤销/重做
- 注意：组会自动展开参与合并；视频元素不参与合并