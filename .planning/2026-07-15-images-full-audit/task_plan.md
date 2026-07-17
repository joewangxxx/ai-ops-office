# 全量 images 严格审计计划

## 目标

对 `C:/Users/29929/Desktop/AI-Wrokspace/images` 中全部图片做项目可用性审计：建立完整库存，核对代码/配置实际引用与预期资产矩阵，检测解码、格式、尺寸、透明度、清晰度、像素风格、裁切、主体完整性、残留背景、层叠/方向/身份一致性，并给出缺失清单、修复优先级、可执行方案与 imagegen prompt。当前审计阶段只读；除完成上一轮已获授权的 Kara/Rita 坐姿定稿外，不批量修图或生图。

## 范围与判定原则

- 资产根目录：`images/`
- 需求来源优先级：运行时代码/清单实际引用 > 项目文档/验收约定 > 目录命名模式推断。
- “存在”不等于“可用”：必须同时通过技术门、清晰/完整门、风格门、语义门和场景门。
- 对无法自动判断的身份、方向、动作与层叠关系，必须生成对照表并人工复核。
- 用户点名的 `imagegen` 用于制定后续逐张修复流程与 prompt；未经用户批准修复清单，本轮不调用它批量改图。

## 阶段

- [completed] Phase 0：完成并验证上一轮 Kara/Rita 最终色板定稿
- [completed] Phase 1：盘点全部图片与代码/配置引用，建立“磁盘—引用—预期”矩阵
- [completed] Phase 2：运行全量技术、清晰度与完整性扫描
- [completed] Phase 3：生成分类对照表并做人工视觉/场景审计
- [completed] Phase 4：汇总缺失、冗余、错误与风险，按严重度分类
- [completed] Phase 5：提出 2–3 种修复路线，给推荐方案与逐类 imagegen prompt
- [completed] Phase 6：交付独立审计报告、证据文件和待确认的修复批次

## 并行只读任务

1. 库存与引用：枚举 `images`，扫描源码/配置/文档中的路径与命名约定，定位缺失和孤儿资产。
2. 技术质量：逐文件验证解码、格式、尺寸、模式、alpha、边界、主体、色彩/绿幕、重复与清晰度代理指标。
3. 视觉与项目适配：按 avatars/furniture/scene 等分类生成对照表，复核身份、方向、动作、比例、像素密度与合成层叠。

## 交付物

- `.planning/2026-07-15-images-full-audit/inventory.csv`
- `.planning/2026-07-15-images-full-audit/reference-matrix.csv`
- `.planning/2026-07-15-images-full-audit/technical-audit.json`
- `.planning/2026-07-15-images-full-audit/contact-sheets/`
- `.planning/2026-07-15-images-full-audit/audit-report.md`
- `.planning/2026-07-15-images-full-audit/repair-plan.md`
- `.planning/2026-07-15-images-full-audit/imagegen-prompts.md`

## 错误记录

| 错误 | 次数 | 处理 |
|---|---:|---|
| 生成引用矩阵时 JavaScript 正则转义错误 | 1 | 改用原生正则分隔符转义后重试 |
| `apply_patch` 新文件末行格式错误 | 1 | 移除内容末尾多余 `+`，重新生成 81 行矩阵 |
