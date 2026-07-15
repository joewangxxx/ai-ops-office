# Findings

- 独立报告明确列出 10 个失败文件：Bob、Jack、Kara、Leo、Rita 的 `seated-idle-back.png` 与 `seated-working-back.png`。
- `seated-contact-sheet.png` 显示 Alice、Quinn 的头肩、躯干与座位轴线居中，Working 双臂朝画面上方；其余五名角色的头肩、躯干、膝腿和手臂主轴均朝画面右侧。
- Bob 的原始 `seated-working-back.png` 单图确认：侧向几何存在于源精灵本身，并非合成器造成；双手横向伸向右侧，腿也向右伸出。
- 对照表中的 `auto: pass` 只代表自动技术/基础布局检查通过，并未判断人物是否正对上方工位。
- 初步结论：10 张均为姿势/朝向语义失败，X/Y 平移不会改变内部肢体方向，不能靠锚点补救。
- `movement-contact-sheet.png` 的 7×4 共 28 张移动资产方向、人物身份和 carry 语义均一致，没有发现新增返工项。
- Alice 原始 `seated-working-back.png` 提供了直接合格对照：背部沿中轴，左右肩和双手基本对称，双手明确朝画面上方。
- 前端 `calculateScenePlacement` 仅计算 `left`/`top`，`toSceneRelativeStyle` 仅输出 `left`、`top`、`width`、`height`；图像 CSS 仅铺满容器并使用像素化渲染，没有旋转或骨架变形。因此坐标/锚点/缩放无法修复这类方向错误。
- 交叉复核计数闭合：Alice/Quinn 12 张 + 其余五人 movement 20 张 = 32 张通过；五人各 2 张 seated = 10 张返工；总计 42 张。
- `validation.json` 的 42/42 仅为自动技术通过，`manual_reviewed_count` 为 0、整体状态仍为 `manual_review_required`，与人工视觉 32/42 不矛盾。
