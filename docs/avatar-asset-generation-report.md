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

| 文件路径 | 尺寸/模式 | Alpha 边界 | 使用参考 | 重试次数 | 技术验收 | 身份/动作验收 | 场景合成验收 |
|---|---|---|---|---:|---|---|---|
| `images/avatars/Jack/seated-idle-back.png` | 1254×1254 / RGBA | (437,237)-(816,962) | Jack 四张原图；工位/Office Shell | 1 | 通过 | 通过 | 通过（需 seated 专用 Y 锚点） |
| `images/avatars/Jack/seated-working-back.png` | 1254×1254 / RGBA | (437,252)-(817,959) | 已通过 seated-idle；Jack idle/at-desk；工位/Office Shell | 0 | 通过 | 通过 | 通过（与 idle 共用锚点） |
| `images/avatars/Jack/walk-up.png` | 1254×1254 / RGBA | (420,141)-(824,1089) | Jack idle/walk；Office Shell | 0 | 通过 | 通过 | 通过 |
| `images/avatars/Jack/walk-down.png` | 1254×1254 / RGBA | (413,166)-(832,1062) | 已通过 walk-up；Jack idle/walk；Office Shell | 0 | 通过 | 通过 | 通过 |
| `images/avatars/Jack/carry-up.png` | 1254×1254 / RGBA | (438,127)-(945,1045) | 已通过 walk-up；Jack carry/idle；Office Shell | 2 | 通过 | 通过；空白文件夹在 180px 下清晰 | 通过 |
| `images/avatars/Jack/carry-down.png` | 1254×1254 / RGBA | (418,163)-(826,1056) | 已通过 walk-down；Jack carry/idle；Office Shell | 0 | 通过 | 通过 | 通过 |

### Bob

| 文件路径 | 尺寸/模式 | Alpha 边界 | 使用参考 | 重试次数 | 技术验收 | 身份/动作验收 | 场景合成验收 |
|---|---|---|---|---:|---|---|---|
| `images/avatars/Bob/seated-idle-back.png` | 1254×1254 / RGBA | (431,258)-(826,974) | Bob idle/at-desk/walk；工位/Office Shell | 0 | 通过 | 通过 | 通过（需 seated 专用 Y 锚点） |
| `images/avatars/Bob/seated-working-back.png` | 1254×1254 / RGBA | (448,261)-(813,968) | 已通过 seated-idle；Bob idle/at-desk；工位/Office Shell | 0 | 通过 | 通过；上半轮廓 IoU 0.997083 | 通过（与 idle 共用锚点） |
| `images/avatars/Bob/walk-up.png` | 1254×1254 / RGBA | (448,189)-(784,1015) | Bob idle/walk/at-desk；Office Shell | 0 | 通过 | 通过 | 通过 |
| `images/avatars/Bob/walk-down.png` | 1254×1254 / RGBA | (453,148)-(809,1027) | 已通过 walk-up；Bob idle/walk；Office Shell | 0 | 通过 | 通过 | 通过 |
| `images/avatars/Bob/carry-up.png` | 1254×1254 / RGBA | (458,167)-(911,1034) | 已通过 walk-up；Bob carry/idle；Office Shell | 1 | 通过 | 通过；attempt 1 被拒 | 通过 |
| `images/avatars/Bob/carry-down.png` | 1254×1254 / RGBA | (431,138)-(874,1080) | 已通过 walk-down/carry-up；Bob carry；Office Shell | 0 | 通过 | 通过 | 通过 |

### Kara

| 文件路径 | 尺寸/模式 | Alpha 边界 | 使用参考 | 重试次数 | 技术验收 | 身份/动作验收 | 场景合成验收 |
|---|---|---|---|---:|---|---|---|
| `images/avatars/Kara/seated-idle-back.png` | 1254×1254 / RGBA | (441,254)-(817,889) | Kara idle/at-desk/walk；工位/Office Shell | 0 | 通过 | 通过；背面无胸章 | 通过（需 seated 专用 Y 锚点） |
| `images/avatars/Kara/seated-working-back.png` | 1254×1254 / RGBA | (442,256)-(817,888) | 已通过 seated-idle；Kara idle/at-desk；工位/Office Shell | 0 | 通过 | 通过；上半轮廓 IoU 0.988435 | 通过（与 idle 共用锚点） |
| `images/avatars/Kara/walk-up.png` | 1254×1254 / RGBA | (422,167)-(835,978) | Kara idle/walk；Office Shell | 0 | 通过 | 通过；背面无胸章 | 通过 |
| `images/avatars/Kara/walk-down.png` | 1254×1254 / RGBA | (429,176)-(825,948) | 已通过 walk-up；Kara idle/walk；Office Shell | 0 | 通过（matte `edge-contract 1`） | 通过；正面仅一个金色四角胸章 | 通过 |
| `images/avatars/Kara/carry-up.png` | 1254×1254 / RGBA | (425,193)-(865,991) | 已通过 walk-up；Kara carry/idle；Office Shell | 0 | 通过 | 通过；背面无胸章 | 通过 |
| `images/avatars/Kara/carry-down.png` | 1254×1254 / RGBA | (441,218)-(828,974) | 已通过 walk-down/carry-up；Kara carry；Office Shell | 0 | 通过 | 通过；正面仅一个金色四角胸章 | 通过 |

### Leo

| 文件路径 | 尺寸/模式 | Alpha 边界 | 使用参考 | 重试次数 | 技术验收 | 身份/动作验收 | 场景合成验收 |
|---|---|---|---|---:|---|---|---|
| `images/avatars/Leo/seated-idle-back.png` | 1254×1254 / RGBA | (459,271)-(807,960) | Leo idle/at-desk/walk；工位/Office Shell | 0 | 通过 | 通过 | 通过（需 seated 专用 Y 锚点） |
| `images/avatars/Leo/seated-working-back.png` | 1254×1254 / RGBA | (460,272)-(808,956) | 已通过 seated-idle；Leo idle/at-desk；工位/Office Shell | 0 | 通过 | 通过；上半轮廓 IoU 0.982 | 通过（与 idle 共用锚点） |
| `images/avatars/Leo/walk-up.png` | 1254×1254 / RGBA | (447,167)-(811,1012) | Leo idle/walk；已通过 walk-down；Office Shell | 1 | 通过 | 通过；最终尺度修正 | 通过（约 121.3px 高） |
| `images/avatars/Leo/walk-down.png` | 1254×1254 / RGBA | (454,188)-(824,968) | 已通过 walk-up；Leo idle/walk；Office Shell | 0 | 通过 | 通过；正面仅一个浅色小方章 | 通过 |
| `images/avatars/Leo/carry-up.png` | 1254×1254 / RGBA | (441,161)-(903,1044) | 已通过 walk-up/carry-down；Leo carry；Office Shell | 3 | 通过 | 通过；前两稿文件夹含混，第三稿尺度偏小 | 通过（约 126.7px 高） |
| `images/avatars/Leo/carry-down.png` | 1254×1254 / RGBA | (457,189)-(817,1012) | 已通过 walk-down/carry-up；Leo carry；Office Shell | 1 | 通过 | 通过；首稿像包/盾被拒 | 通过 |

### Quinn

| 文件路径 | 尺寸/模式 | Alpha 边界 | 使用参考 | 重试次数 | 技术验收 | 身份/动作验收 | 场景合成验收 |
|---|---|---|---|---:|---|---|---|
| `images/avatars/Quinn/seated-idle-back.png` | 1254×1254 / RGBA | (415,259)-(823,966) | Quinn idle/at-desk/walk；工位/Office Shell | 0 | 通过 | 通过；背面无眼镜正面/胸章 | 通过（需 seated 专用 Y 锚点） |
| `images/avatars/Quinn/seated-working-back.png` | 1254×1254 / RGBA | (408,270)-(827,958) | 已通过 seated-idle；Quinn idle/at-desk；工位/Office Shell | 0 | 通过 | 通过；仅改变前臂工作姿态 | 通过（与 idle 共用锚点） |
| `images/avatars/Quinn/walk-up.png` | 1254×1254 / RGBA | (457,216)-(799,987) | Quinn idle/walk；已通过 seated-idle；Office Shell | 0 | 通过 | 通过；背面无胸章 | 通过 |
| `images/avatars/Quinn/walk-down.png` | 1254×1254 / RGBA | (447,224)-(811,996) | 已通过 walk-up；Quinn idle/walk；Office Shell | 0 | 通过 | 通过；正面仅一个白色方章 | 通过 |
| `images/avatars/Quinn/carry-up.png` | 1254×1254 / RGBA | (441,171)-(893,962) | 已通过 walk-up；Quinn carry/idle；Office Shell | 0 | 通过 | 通过；单个空白页签文件夹 | 通过 |
| `images/avatars/Quinn/carry-down.png` | 1254×1254 / RGBA | (448,190)-(813,1012) | 已通过 walk-down/carry-up；Quinn carry；Office Shell | 0 | 通过 | 通过；正面仅一个白色方章 | 通过 |

### Rita

| 文件路径 | 尺寸/模式 | Alpha 边界 | 使用参考 | 重试次数 | 技术验收 | 身份/动作验收 | 场景合成验收 |
|---|---|---|---|---:|---|---|---|
| `images/avatars/Rita/seated-idle-back.png` | 1254×1254 / RGBA | (454,276)-(801,932) | Rita idle/at-desk；工位/Office Shell | 1 | 通过 | 通过；首稿像站姿被拒 | 通过（需 seated 专用 Y 锚点） |
| `images/avatars/Rita/seated-working-back.png` | 1254×1254 / RGBA | (457,279)-(797,931) | 已通过 seated-idle；Rita idle/at-desk；工位/Office Shell | 2 | 通过 | 通过；头发代理 IoU 0.99626 | 通过（与 idle 共用锚点） |
| `images/avatars/Rita/walk-up.png` | 1254×1254 / RGBA | (457,195)-(776,985) | Rita walk/carry/idle；Office Shell | 0 | 通过 | 通过；长弧形后马尾 | 通过 |
| `images/avatars/Rita/walk-down.png` | 1254×1254 / RGBA | (423,209)-(786,986) | 已通过 walk-up；Rita walk/idle；Office Shell | 0 | 通过 | 通过；非圆形高髻 | 通过 |
| `images/avatars/Rita/carry-up.png` | 1254×1254 / RGBA | (443,190)-(878,985) | 已通过 walk-up；Rita carry/walk；Office Shell | 0 | 通过 | 通过；单个空白文件夹 | 通过 |
| `images/avatars/Rita/carry-down.png` | 1254×1254 / RGBA | (411,198)-(823,986) | 已通过 walk-down/carry-up；Rita carry；Office Shell | 0 | 通过 | 通过；单个空白文件夹 | 通过 |

## 4. Contact Sheet

- seated：已生成 `tmp/imagegen/validation/seated-contact-sheet.png`，包含 7×2 分层工位合成与原始裁切。
- movement：已生成 `tmp/imagegen/validation/movement-contact-sheet.png`，包含 7×4、约 180px 的 Office Shell 脚锚合成。
- 技术 JSON：`tmp/imagegen/validation/avatar-asset-validation.json`；42/42 present、42 technical pass、0 missing、0 failure。JSON 不推断视觉语义，独立人工结论记录在本报告。

## 5. 最终结论

完成。42/42 目标资产均已生成并通过技术、身份/动作、禁止项与场景合成验收；自动扫描结果为 42 present、42 technical pass、0 missing、0 failure，12 项验证器测试全部通过。两张正式 Contact Sheet 与本报告已完成独立复核。

28 张旧参考图均与 `HEAD` 哈希一致。上述结论描述的是资产生成阶段：该阶段按约束未修改前端代码、`office-layout.json`、坐标或事件系统，并把专用 seated 锚点留给后续集成。

## 6. Scheme A 集成状态（2026-07-16）

后续 Scheme A 已完成布局与运行时接入：`office-layout.json` 现在登记 7 名角色各 10 个姿势（70 条 Avatar 路径），坐姿使用每张图自己的 `visualSeatedBaseCenterSource` 和工位 `seatedBackAnchor`，按 150×150 渲染；移动姿势按路线方向选择通用/Up/Down 资源并按 180×180 渲染。静态在线人员仅以非空 `PersonScenario.currentTask` 判定 Active Work，选择 `seatedIdleBack` 或 `seatedWorkingBack`；离线工位不渲染 Avatar。图层顺序为 `desk-chair-back → avatar → desk-front`，未选中的姿势不进入 DOM。

透明 RGB 规范化也已执行：固定 34 文件组由 33,521,337 bytes 降至 10,260,945 bytes；加入 `Kara/walk-down.png` 后的 35 文件总计由 33,781,582 bytes 降至 10,502,131 bytes，共清除 43,261,599 个距可见 Alpha 超过 2px 的透明 RGB 像素。所有 Alpha、`alpha>0` RGBA、边界框和 2px 保护轮廓保持不变。

持久门禁以 `docs/office-layout.json` 为唯一清单，当前证明 81/81 路径存在、唯一、大小写精确、PNG/IHDR/尺寸/色型正确；Python 全量审计同时验证解码、Alpha、边缘、精确 `#00ff00`、透明 RGB 轮廓、重复 SHA、压缩预算和分类光影策略。运行时最终截图与合成验收另见 Scheme A 最终验证记录。
