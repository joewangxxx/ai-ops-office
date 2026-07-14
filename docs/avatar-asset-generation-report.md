# AI Office 角色图片资产生成与验收报告

## 1. 范围

- 角色：Alice、Bob、Jack、Kara、Leo、Quinn、Rita。
- 每名角色：`seated-idle-back.png`、`seated-working-back.png`、`walk-up.png`、`walk-down.png`、`carry-up.png`、`carry-down.png`。
- 最终格式：1254×1254、PNG、RGBA、四角透明，仅包含人物；carry 仅使用无字中性文件夹。
- 本任务未修改前端代码、`office-layout.json`、角色坐标或事件系统。

## 2. 生产与验收方法

1. 使用当前角色自身的 `idle.png`、`at-desk.png`、`walk.png`、`carry.png` 作为身份/动作参考，公共工位与 Office Shell 仅用于透视、尺度与合成检查。
2. 使用内置 Imagegen 单资产生成到绿幕源图；未切换 CLI、`gpt-image-1.5` 或其他模型路径。
3. 使用安装的 `remove_chroma_key.py`，参数为 `--auto-key border --soft-matte --transparent-threshold 12 --opaque-threshold 220 --despill`。
4. 技术验收检查 PNG/RGBA/1254×1254、四角 Alpha、Alpha 边界、连通组件、绿幕残留与裁切。
5. seated 按约 150×150、`椅背 → 人物 → 桌前` 顺序合成；movement 按约 180×180、统一脚底锚点合成到 `office-shell.png`。
6. 身份、方向、动作与禁止项由视觉复核判定；脚本指标不替代视觉验收。

## 3. 逐项记录

### Alice

| 文件路径 | 尺寸/模式 | Alpha 边界 | 使用参考 | 重试次数 | 技术验收 | 身份/动作验收 | 场景合成验收 |
|---|---|---|---|---:|---|---|---|
| `images/avatars/Alice/seated-idle-back.png` | 1254×1254 / RGBA | (458,277)-(800,965) | Alice 四张原图；工位/Office Shell；复用候选 | 1 次替代尝试未采用 | 通过 | 通过 | 通过（需 seated 专用 Y 锚点） |
| `images/avatars/Alice/seated-working-back.png` | 1254×1254 / RGBA | (445,280)-(810,964) | 已通过 seated-idle；Alice idle/at-desk；工位/Office Shell | 0 | 通过 | 通过 | 通过（与 idle 共用锚点） |
| `images/avatars/Alice/walk-up.png` | 1254×1254 / RGBA | (470,219)-(773,996) | Alice idle/walk；已通过 seated-idle；Office Shell | 0 | 通过 | 通过 | 通过 |
| `images/avatars/Alice/walk-down.png` | 1254×1254 / RGBA | (454,182)-(788,1067) | 已通过 walk-up；Alice idle/walk；Office Shell | 0 | 通过 | 通过 | 通过 |
| `images/avatars/Alice/carry-up.png` | 1254×1254 / RGBA | (462,178)-(829,1016) | 已通过 walk-up；Alice carry/idle/seated-idle；Office Shell | 0 | 通过 | 通过 | 通过 |
| `images/avatars/Alice/carry-down.png` | 1254×1254 / RGBA | (466,164)-(786,1044) | 已通过 carry-up/walk-down；Alice carry/idle；Office Shell | 0 | 通过 | 通过 | 通过 |

### Jack

待 Phase D 生成与独立验收后填写。

### Bob、Kara、Leo、Quinn、Rita

待 Phase E 生成与独立验收后逐角色填写。

## 4. Contact Sheet

- seated：待 42 张资产完成后生成 `tmp/imagegen/validation/seated-contact-sheet.png`。
- movement：待 42 张资产完成后生成 `tmp/imagegen/validation/movement-contact-sheet.png`。

## 5. 最终结论

进行中；只有 42/42 资产、两张 Contact Sheet 与本报告全部通过后更新为完成。
