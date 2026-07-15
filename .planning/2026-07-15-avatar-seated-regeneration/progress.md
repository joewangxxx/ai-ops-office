# Progress

## 2026-07-15

- 启动 10 张 seated 资产返工任务。
- 读取旧生成计划、独立验收报告、身份参考审计表和坐姿对照表。
- 确认设计输入完整；正在整理生成方案并等待设计关卡确认。
- 完成三路只读交叉设计审计，收敛为“先 Idle、后 Working”的推荐方案，并形成逐角色身份锁与姿势硬门。
- 用户确认采用方案 A：每个角色先生成并验收 Idle，再从该 Idle 派生 Working。
- 完成书面设计初稿与独立自检；修正了前倾矛盾、调用/重试表述、参考图白名单、哈希基线和像素风格门五项问题。
- 二次自检补齐最终完成标准中的像素风格门；书面设计自检通过。
- 设计说明已单独提交为 `4b904a4`，未纳入工作树中的其他既有改动；等待用户复核书面设计。
- 用户明确调用 imagegen 并要求立即执行，视为书面设计批准。
- 使用 writing-plans 生成逐任务执行计划与完整 prompt-set；进入 Task 1。
- Task 1 完成：建立 15 个候选目录，备份 10 张失败图且哈希全部一致，保存 60 个非返工文件的 SHA-256 基线，prompt-set 白名单校验通过。
- Bob Idle 首次调用在生成前被工具拒绝：参考图超过 5 张上限，未消耗生成候选。已将所有调用的白名单压缩为 5 张并同步执行计划。
- Bob Idle attempt 1 完成内置生成、绿幕抠图、技术分析、原图与工位合成验收；通过并冻结为 accepted-alpha.png。
- Jack Idle attempt 1 通过技术、身份、正背面姿势与工位合成验收；冻结为 accepted-alpha.png。
- Kara Idle attempt 1 通过技术、身份、像素风格、正背面姿势与工位合成验收；冻结为 accepted-alpha.png。
- Leo Idle attempt 1 通过技术、身份、像素风格、正背面姿势与工位合成验收；冻结为 accepted-alpha.png。
- Rita Idle attempt 1 通过技术、身份、像素风格、正背面姿势与工位合成验收；冻结为 accepted-alpha.png。
- Task 2 完成：五名角色的 Idle 均在首个实际生成候选通过并冻结，最终资产尚未覆盖。
- Bob Working attempt 1 被人工工位合成门淘汰；下一次仅收窄并下移双手，使手掌朝下落向键盘中心。
- Bob Working attempt 2 完成技术、配对、原图与工位合成复核；通过并冻结为 accepted-alpha.png。
- Jack Working attempt 1 完成技术、配对、原图与工位合成复核；通过并冻结为 accepted-alpha.png。
- Kara Working attempt 1 完成技术、配对、原图与工位合成复核；通过并冻结为 accepted-alpha.png。
- Leo Working attempt 1 完成技术、配对、原图与工位合成复核；通过并冻结为 accepted-alpha.png。
- Rita Working attempt 1 技术与配对通过，但人工工位动作门因双手不可见而淘汰；下一次仅补出中央键盘宽度内的小型肤色手部。
- Rita Working attempt 2 完成定点返修与技术、配对、原图、工位合成复核；通过并冻结为 accepted-alpha.png。
- Task 3 完成：五张 Working 均从各自已验收 Idle 派生并通过人工工位动作门；最终资产路径仍未覆盖，进入成对晋级与整套验证。
- 替换前整组候选对照复核发现 Kara Working 双手不可见，撤销其暂定晋级并重开 Task 3；其余九张候选保持冻结，最终资产仍未覆盖。
- Kara Working attempt 2 完成定点补手、技术、配对与工位合成复核；重新通过并冻结。Task 3 再次完成，进入整组候选复核与最终成对晋级。
- 最终候选 10/10 存在且非空，技术状态全部 pass；五组 upper IoU 为 0.924–0.985，中心 X 漂移均不超过 2px。两路独立只读候选 QA 均判定五组 PASS、无阻断项。
- 已成对晋级 10 张最终资产；10/10 最终哈希与 accepted 候选一致，且 10/10 均与返工前备份哈希不同。
- 验证器单元测试 12/12 通过。
- 第三路独立身份 QA 捕获 Kara/Rita Working 的非手臂色板跳变；42/42 技术结果不作为最终完成。重开 Task 3，对两张 Working 做姿势不变的色板统一，随后重新晋级和重跑全部验证。
