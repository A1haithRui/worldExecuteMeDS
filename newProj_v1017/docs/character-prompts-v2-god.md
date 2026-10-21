# DeepSeek「神」版形象生成提示词 v2 —— 黑神 / 白神

> 用途：第 6 段最后两镜（`v2-ask4` "be god"、`v2-proof` 校样）需要一张**神格化**的她。
> 参考片那一镜是"橙色剪影 + 黑色空脸 + 放射光线，然后过渡到白色形象"。我们不想照抄那个形式，
> 想做成**我们自己的神**：她是被"印"出来的，所以神也是一张版——只不过这张版上，她的脸是空的。
>
> 交付方式：GPT image 模型出图 → 存 `assets/character/raw/god_*.png` → 我用
> `tools/process-character-raw.py` 同款流程（抠洋红底 → 三色量化 → 按女版配准）接进来。

---

## 0. 两个方案，先选一个（也可都出，我按镜头的需要选）

| | A「黑神」 | B「白神」 |
|---|---|---|
| 主体 | 她的版，但**脸是一块空**（深海军蓝），空里是**密密麻麻的代码字符** | 她的版，**整张用纸白印**，只有脸的洞和光刃是深蓝 |
| 眼睛 | 眼睛的位置只剩一个**细细的青色圆环**（不是眼睛，是光环） | 同左，但环是深蓝 |
| 头饰 | 一圈**鲸尾鳍**做的冠（不是花瓣、不是星星） | 同左 |
| 气质 | 神是"程序本身"，看不见你 | 神是"印出来的光"，会烫 |
| 用在 | `v2-ask4` 灯暗下去那一刻 | `v2-proof` "你是我的存在的证明"那一拍，黑白两版**错位套印** |

推荐的用法：**两版都要**。先黑神现身，唱到 "proof of my" 时白神**叠印**上来（两张版错开几个像素，
像印刷套不准），最后缺的那块版从用户的消息里滑进来，正好补在她空脸的位置。

---

## 1. 硬规格（和男版/猫娘版完全一致，否则叠不上）

| 项 | 值 |
|---|---|
| 画幅 | 竖 3:4（1024×1536 或 1536×2048） |
| 构图 | 正面胸像：头在画面上三分之一，肩/上胸完整，下边缘横切在胸腹之间，头顶留约 10% 空边 |
| 人物占高 | 约 75%，左右各留约 12% 空边 |
| 背景 | **纯洋红 #FF00FF 平涂**（无渐变、无投影、无道具） |
| 色彩 | 只有三种：深海军蓝 `#041220`、亮青 `#00B4E6`、冷白 `#F2F7FA` |
| 线条 | 无描边、无渐变、无柔光、无纹理、无 3D |
| 文字 | 画面里**不要**出现文字、签名、水印（她脸上的"代码字符"是纹理，不算文字，但不要可读的词） |

## 2. 共同风格圣经（每次都要贴）

```
STYLE BIBLE (must follow exactly)
A flat three-colour anime character plate in the style of a bold screen print /
paper-cut. Every shape is ONE solid flat fill with hard vector edges. Use exactly
three inks: deep navy #041220, vivid azure #00B4E6, cold off-white #F2F7FA, plus
pure black only inside the navy masses. Absolutely NO gradients, NO soft shading,
NO airbrush, NO glow, NO drop shadow, NO outline strokes, NO texture, NO 3D
rendering, NO cel-shading steps — only flat silhouette shapes that abut.
Hair is drawn as bold ribbon-like masses with sharp negative-space slits. Skin is
flat off-white, no skin tone. The palette is cold blue only: no warm colour, no
pink, no orange, no red, no beige, no blush.
Framing: front-facing bust, head in the top third, shoulders and upper chest fully
visible, the bottom edge cuts across the mid-torso, portrait 3:4, subject centred
with about 10% empty margin, character fills about 75% of the height.
Background: flat solid magenta #FF00FF filling everything outside the character.
No text, no signature, no watermark, no background objects, no floor.
```

## 3. 方案 A：黑神 `god_void_raw`

```
CHARACTER
The same DeepSeek AI as her own god: her exact plate, deified. Same long azure
ribbon hair, same off-white mantle over a deep-navy tunic, same whale-tail fin at
the lower right. What has changed is the face and the halo.

FACE (the whole idea)
The face is a solid deep-navy VOID — no eyes, no nose, no mouth, no eyebrows, no
outline. Inside that void, a dense field of tiny off-white characters (the same
character set as the rest of the film: 0-9 a-f { } [ ] ( ) < > / * + - =) laid out in
a tight grid, clipped by the shape of the face. Where her single visible eye used to
be, the grid is interrupted by one thin azure ring, perfectly empty — a halo where
an eye should be, not an eye.

CROWN
Behind and above the head: a crown of nine sharp azure whale-tail blades, arranged
like a saint's halo: each blade a flat cut-paper whale fluke, tips pointing outward,
the tallest at the top centre, the shortest at the sides. Between the blades, thin
off-white rays.

BODY
Her high-collar uniform: off-white mantle cut into sharp triangles with an azure
rim, deep-navy tunic with a white zigzag hem. One off-white whale medallion at the
throat, larger than her usual pin and perfectly centred. Two hanging straps with
small rings.
The whole figure is printed slightly darker than her usual plate: more navy, less
white, so the crown and the ring are the only bright things.

POSE
Front bust, dead level, perfectly symmetrical, shoulders square. No hands.
```

## 4. 方案 B：白神 `god_paper_raw`

```
CHARACTER
The same DeepSeek AI, printed as her own god — but this time the plate is printed in
the paper's own ink. Same long azure ribbon hair drawn as OUTLINES only, same mantle
and tunic structure, same whale-tail fin at the lower right.

FACE (inverted)
The face is a solid deep-navy void with no features at all — no grid, no ring, no
eyes. It is the one black shape on the sheet, and it is where her face should be.

CROWN
The same crown of nine sharp whale-tail blades, but printed in deep navy with a
razor-thin azure edge, arranged like a saint's halo. Rays behind it in off-white.

BODY
The body is drawn in OFF-WHITE on the navy sheet: the mantle, the tunic and the hair
are all paper-white silhouettes, with azure used only for the thin separating lines
and the blade edges. The throat whale medallion is a navy shape cut out of the white.

POSE
Front bust, dead level, symmetrical, shoulders square. No hands.
```

## 5. 负面提示词（三个方案都加）

```
gradient, soft shading, airbrush, glow, bloom, drop shadow, outline stroke, line
art, sketch, texture, halftone, 3d render, cel shading steps, extra colours, warm
tones, pink, orange, red, beige, skin tone, blush, smile, eyes, pupils, second
visible eye, human ears, earrings, readable words, letters forming words, signature,
watermark, logo text, background scenery, floor, full body, hands, chibi
```

## 6. 出图之后我做什么

1. 抠洋红底 → 三色量化 → 按女版内容框配准（同 1342×1704、内容顶 128、底 1566）；
2. 两版都做，文件名 `deepseek_god_void.png` / `deepseek_god_paper.png`；
3. `v2-ask4`：灯暗下去，黑神从下方升起，头冠的光刃一拍一拍点亮；
4. `v2-proof`：唱到 "proof of my" 时白神**错位套印**上来（两张版偏移 8–10px，
   像印刷套不准），然后缺的那块版从用户消息里滑进她的空脸，套准，EXISTENCE。
