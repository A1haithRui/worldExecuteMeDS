# DeepSeek 角色形象生成提示词 v1 —— 男性版 / 猫娘版

> 用途：交给 GPT 的 image 模型（image2 / gpt-image-1）生成两个新形象，产出后由我
> 统一量化成我们的三色版画、切透明底、对齐配准，再放进第 7 段（Gender / On call /
> Trance）。
>
> 写这份文档的依据：把我们现有的 `deepseek_bust_v3.png` 拆开看了配色和形状语言，
> 参考了 Claude 版 `boy_bust / man_bust / cat_bust / cat_paws` 的做法（它那几个
> 是"同一张脸以不同印法出现"），但**刻意做得比它更有我们的特色**：Claude 版的脸
> 是一团黑、只靠发型和衣服区分；我们保留"只露一只眼 + 鲸鱼信物"这两条品牌特征，
> 让三个版本一看就是**同一个东西的不同印法**。

---

## 0. 一句话原则（三个版本必须共同遵守）

**同一个实体，换一种印法。** 不是三个不同的角色，是同一个人被设置成 F / M / 猫：
配色、眼睛、鲸鱼信物、三色平涂语言必须完全一致，只有发型、体态、服装结构和耳/尾
这些"印法"变了。

---

## 1. 硬规格（出图前先定好，不然我要返工）

| 项 | 值 |
|---|---|
| 画幅 | 竖构图 3:4（1024×1536 或 1536×2048 都可以，我最后会缩到 1342×1704） |
| 构图 | 正面半身胸像（bust）：头在画面上三分之一，肩和上胸完整，**下边缘横切在胸腹之间**，头顶上方留约 10% 空边 |
| 人物占高 | 约 75%（从头顶到胸口），左右各留约 12% 空边 |
| 背景 | **纯品红 #FF00FF 平涂**，无渐变、无投影、无地面、无任何道具（我们的三色里没有洋红，切图最干净）；如果模型不肯给纯色，就换**纯黑 #000000 平涂** |
| 色彩数量 | 只能有三种平涂色 + 纯黑：深海军蓝 `#041220`、亮青 `#00B4E6`、冷白 `#F2F7FA` |
| 线条 | 没有描边线、没有渐变、没有柔和阴影、没有高光晕、没有纹理、没有 3D 感 |
| 文字 | 画面上**不许有任何文字、签名、水印、logo**（鲸鱼那个是图形不是文字，可以） |
| 一致性 | 两张图和现有女性版**必须能原位叠在一起**（同一构图、同一视平线、同一缩放） |

---

## 2. 共同风格圣经（每次都要贴，别省）

```
STYLE BIBLE (must follow exactly)
A flat three-colour anime character plate in the style of a bold screen print /
paper-cut. Every shape is ONE solid flat fill with hard vector edges. Use exactly
three inks: deep navy #041220, vivid azure #00B4E6, cold off-white #F2F7FA, plus
pure black only as a shadow inside navy masses. Absolutely NO gradients, NO soft
shading, NO airbrush, NO glow, NO drop shadow, NO outline strokes, NO texture, NO
3D rendering, NO cel-shading steps — only flat silhouette shapes that abut.
Hair is drawn as bold ribbon-like masses with sharp negative-space slits cut
through them. Skin is the flat off-white ink (no skin tone). The character shows
ONLY ONE large anime eye (the viewer's left); the other side of the face is hidden
behind hair. No visible human ears. The palette is cold blue only: no warm colour,
no pink, no orange, no red, no beige, no blush.
Framing: front-facing bust, head in the top third, shoulders and upper chest fully
visible, the bottom edge cuts across the mid-torso, portrait 3:4, subject centred
with about 10% empty margin, character fills about 75% of the height.
Background: flat solid magenta #FF00FF filling everything outside the character.
No text, no signature, no watermark, no background objects, no floor.
```

---

## 3. 男性版：`deepseek_man_bust`

### 3.1 设计思路（给你看，不用贴给模型）

- 他 = **她被设成 M 之后的那一版**。所以不是"另一个人"，是同一个 AI 印得更冷、更硬、
  更收。
- 保留三条品牌线索：**只露一只眼**、**鲸鱼信物**、**青色+深蓝+白的平涂**。
- 女性版的形状语言是"大波浪、外扩、锋利三角"；男性版反过来：**收、直、上挑**。
- 不要做成帅哥头像，要像一张版画：色块大、留白狠、轮廓是几何切的。

### 3.2 提示词（英文，直接复制；前面接第 2 节的 STYLE BIBLE）

```
CHARACTER
The same AI entity as the DeepSeek character, printed as a young man: identical
palette, identical one-visible-eye rule, identical whale motif. Cold, hard, and
pulled in — the male print of the same plate.

FACE AND HEAD
Angular cool face, jaw slightly narrow, flat off-white skin. ONE large anime eye
visible on the viewer's left: navy upper lash mass, azure iris with a white
highlight and a small dark pupil, calm steady gaze. The other side of the face is
covered by a sweep of hair. Thin straight dark brow, a small firm mouth line, one
short nose tick. No blush, no smile, no eyelashes on the hidden side.

HAIR
Short-to-medium azure hair (#00B4E6), swept back and slightly up, with two or three
bold ribbon locks that end in sharp points; one long lock falls across the hidden
eye. One single curled loop of hair stands up at the crown (the same ahoge loop as
her, smaller and tighter). Cut sharp negative-space slits through the hair mass so
it reads as flat ribbons, not strands.

ORNMENTS (the brand, re-placed)
- A small flat off-white whale pin on the high collar, viewer's right.
- Two off-white fin-shaped tabs rising from behind the shoulders like the tips of a
  whale fluke, symmetrical, sharp-edged.
- One large azure whale-tail fin silhouette behind the lower right of the bust.

OUTFIT
High deep-navy military collar with off-white piping; a black band at the throat
with one small round black stud. A large off-white mantle over the shoulders cut
into sharp triangles, edged with an azure line. Deep-navy tunic below, with a
white zigzag hem and one azure diagonal stripe across the chest. Two short hanging
straps with small rings and azure ribbon ends (the same fittings as hers, shorter).
Shoulders slightly broader than the head, torso tapering down.

POSE
Front bust, shoulders squared, head tilted a few degrees down and to the viewer's
left, calm and a little cold. No hands, no full body.
```

### 3.3 负面提示词（negative prompt）

```
gradient, soft shading, airbrush, glow, bloom, drop shadow, outline stroke, line
art, sketch, texture, halftone, 3d render, cel shading steps, extra colours,
warm tones, pink, orange, red, beige, skin tone, blush, smile, second visible eye,
both eyes visible, human ears, earrings, text, letters, signature, watermark, logo,
background scenery, floor, frame, full body, hands, chibi, super deformed
```

---

## 4. 猫娘版：`deepseek_cat_bust`

### 4.1 设计思路（给你看，不用贴给模型）

- Claude 版那只猫是"橘色+虎斑尾+肉球"，很可爱、很暖。我们这只**不能暖**：我们是
  冷色的猫，**耳朵和尾巴也必须是青色的**，可爱要靠"形状"而不是"颜色"。
- 保留她的脸和发型骨架，只加三样东西：**猫耳、竖瞳、尾巴**；信物（鲸鱼别针）
  挪到耳根，作为"这只猫是 DeepSeek 的"的标记。
- 表情从"空白"换成"懒、困、带一点坏"——这是她整支片里唯一一次可以显得"有情绪"。

### 4.2 提示词（英文，直接复制；前面接第 2 节的 STYLE BIBLE）

```
CHARACTER
The same AI entity as the DeepSeek character, printed as a cat-eared variant of
herself: identical palette, identical one-visible-eye rule, identical whale motif,
same long azure ribbon hair. A cold, blue cat — never warm, never orange.

FACE AND HEAD
Same face as her: flat off-white skin, ONE large anime eye visible on the viewer's
left, but the azure iris now has a slim vertical slit pupil. Heavy navy upper lash
mass, one white iris highlight. The other side of the face is hidden behind hair.
Expression: half-lidded, lazy, faintly amused — one small off-white fang at the
corner of a short mouth line. Three thin off-white whisker ticks on the visible
cheek only. No blush.

EARS (the new print)
Two large triangular cat ears on top of the head, azure outer with a bold
off-white inner ear, one cyan stripe inside each; the ears are angled outward at
about 45 degrees and are part of the same flat shape language as the hair — no
fur texture, no fluff strokes.

HAIR
The same long azure ribbon-wave hair as her: big looping locks, sharp
negative-space slits, one large curled ahoge loop at the crown. Add a slightly
heavier straight fringe over the hidden eye.

ORNMENTS (the brand, re-placed)
- The flat off-white whale pin moves to the base of the viewer's-right cat ear.
- Keep the two off-white fin-shaped ornaments at the sides of the head.
- Behind the lower right, replace her whale-tail fin with a long azure cat tail
  that curls forward, carrying three off-white rings and an off-white tip.

OUTFIT
The same high-collar uniform, cut shorter and lighter: off-white sharp-cornered
mantle over the shoulders with azure trim, deep-navy body with a white zigzag hem,
two hanging straps with small rings. The round black stud at the throat becomes a
small flat off-white bell-shaped stud (a flat graphic shape, not a shiny bell).

POSE
Front bust, head tilted slightly to the viewer's left, one shoulder a little
higher than the other, loose and lazy. No hands, no full body.
```

### 4.3 负面提示词（negative prompt）

```
gradient, soft shading, airbrush, glow, drop shadow, outline stroke, line art,
sketch, texture, fur texture, fluffy strokes, 3d render, cel shading steps, extra
colours, warm tones, orange, pink, red, beige, skin tone, blush, human ears,
second visible eye, both eyes visible, oversized head, chibi, super deformed,
text, letters, signature, watermark, logo, background scenery, floor, full body,
hands, ribbons around the neck, collar with a real metal bell with shine
```

---

## 5. 怎么用（实操）

1. **先传参考图**：把 `newProj_v1017/assets/character/deepseek_bust_v3.png`
   （或 `deepseek_eye_v3.png`）作为**风格/身份参考图**一起发给模型，说一句
   "keep the exact same art style, palette and framing as this reference, only
   change the design as described"。
2. 然后把「第 2 节 STYLE BIBLE + 第 3 节（或第 4 节）提示词」整段贴进去。
3. 尺寸选竖向（1024×1536 或 1536×2048），质量 high。
4. **一次出 4 张**，挑最接近的一张；不满意就保留参考图、只改描述里的局部（比如
   "hair shorter", "ears smaller"），不要整套重写。
5. 两个角色**分别生成**，不要一张图里画两个人。
6. 出图后：
   - 存成 `newProj_v1017/assets/character/raw/man_bust_raw.png` /
     `cat_bust_raw.png`（放在 `raw/` 里，原图不要覆盖现有素材）；
   - 或者直接把图发我，我来做后续。

## 6. 出图之后我会做什么（你不用管，知道流程就行）

1. 用我们的三色（`#041220 / #00B4E6 / #F2F7FA`）做**颜色量化**，把模型可能带进来
   的第四种颜色压回去；
2. 用洋红/纯黑底做**抠图**，按她现有的内容框（128..1214 × 128..1566）对齐配准，
   保证三张图能原位叠加；
3. 生成 `lowlight` / `silhouette` 两个衍生版（第 8 段"颜色离开"用的就是这两版）；
4. 接进 `figure.js`，先出静帧给你看，再动第 7 段的 Gender / On call / Trance。
