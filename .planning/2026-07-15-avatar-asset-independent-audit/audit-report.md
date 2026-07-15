# 42 张角色资产独立验收报告

## 最终结论

- 文件完整性：42/42。
- 自动化技术验收：42/42 通过。
- 人工身份、方向与动作验收：42/42 通过。
- 前端工位场景适配：42/42 通过。
- 最终状态：**整套角色图片符合当前素材标准，可以进入前端集成阶段。**

## 本次复验范围

首次验收不通过的以下 10 张图片均已重新生成并复验通过：

- `images/avatars/Bob/seated-idle-back.png`
- `images/avatars/Bob/seated-working-back.png`
- `images/avatars/Jack/seated-idle-back.png`
- `images/avatars/Jack/seated-working-back.png`
- `images/avatars/Kara/seated-idle-back.png`
- `images/avatars/Kara/seated-working-back.png`
- `images/avatars/Leo/seated-idle-back.png`
- `images/avatars/Leo/seated-working-back.png`
- `images/avatars/Rita/seated-idle-back.png`
- `images/avatars/Rita/seated-working-back.png`

## 坐姿复验结果

- 五名角色均改为严格背对镜头、头部和躯干居中。
- 双肩与桌沿平行，身体正对画面上方的显示器和键盘。
- 腿部收在身体和椅子区域内，不再横向伸出。
- Idle 状态双臂放低，没有误表达打字动作。
- Working 状态双前臂向画面上方抬起，明确朝向键盘。
- 同一角色 Idle/Working 的发型、服装、尺度和座位中心保持一致。
- Bob、Jack、Kara 的 Working 手势在 150px 下清晰；Leo、Rita 的手部更含蓄，但原图与工位合成都能辨认双臂抬起。

## 技术与尺度结果

- 所有文件均为 1254×1254 PNG/RGBA。
- 透明四角、单一主体，无绿幕残留、裁切、阴影、家具、文字或额外道具。
- 重新生成的五组 Idle/Working 中心水平漂移不超过 2 个源像素，垂直漂移不超过 6 个源像素。
- 上半轮廓代理 IoU 为 0.924-0.985，身份与共享锚点稳定。
- 在 150px 画布下，可见高度为 75.7-86.8px，与 Alice、Quinn 的 81.9-84.7px 处于合理范围。
- 五组源图中心均位于 x=627-634，符合座位中心约定。

## 前端集成提示

- 新 seated 图片需要使用 seated 专用源锚点和纵向位置。
- 不应直接复用旧的正面 `at-desk.png` 锚点。
- Idle/Working 应共用同一角色坐标，只在状态切换时替换图片。

## 验收证据

- `validation-recheck.json`：42/42 自动化技术通过。
- `seated-contact-sheet-recheck.png`：重新生成后的 7×2 工位合成和原始裁切。
- `movement-contact-sheet-recheck.png`：完整移动姿势回归对照。
- 校验器单元测试：12/12 通过。

