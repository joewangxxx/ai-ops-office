# 10 张坐姿角色资产返工计划

## 目标

重新生成 Bob、Jack、Kara、Leo、Rita 的 `seated-idle-back.png` 与 `seated-working-back.png`，使其严格背对镜头并面向画面上方工位，同时保持角色身份、像素风格、1254×1254 画布与前端图层兼容性；其余 32 张通过资产不变。

## 设计关卡（brainstorming）

- [completed] 探索项目上下文、旧生成记录、身份参考和独立验收证据
- [completed] 评估是否需要视觉伴侣：本任务已有明确对照表，无需额外视觉问答
- [completed] 澄清需求：用户给出的返工标准已覆盖范围、姿势、风格、背景与验收条件
- [completed] 提出可选生成方案并推荐方案
- [completed] 用户确认设计方案
- [completed] 写入设计说明并进行自检
- [completed] 用户复核书面设计说明
- [completed] 使用 writing-plans 制定执行计划

## 执行阶段

- [completed] Task 1：保护现有资产并冻结输入
- [completed] Task 2：生成并验收五张 Idle
- [in_progress] Task 3：从合格 Idle 派生并验收五张 Working（独立身份 QA 触发 Kara/Rita 色板统一）
- [pending] Task 4：成对晋级并重建验证证据
- [pending] Task 5：独立视觉验收与交付

## 后续执行范围

- 逐角色先生成/验收 Idle，再从已通过 Idle 派生 Working。
- 一张资产一次内置 imagegen 调用；绿幕源图经本地抠图后再进入最终目录。
- 每张先在临时目录验证，只有技术与视觉合格才覆盖对应的 10 个目标文件。
- 更新独立验证证据与坐姿对照表；不修改 frontend、布局坐标或其余资产。

## 错误记录

| 错误 | 次数 | 处理 |
|---|---:|---|
| 内置 imagegen 的 `referenced_image_paths` 最多允许 5 张，初始 Bob Idle 传入 7 张而在生成前被拒绝 | 1 | 将所有 Idle/Working 白名单压缩为每次恰好 5 张，保留身份、背面姿势、动作方向与办公室像素风格核心参考 |
