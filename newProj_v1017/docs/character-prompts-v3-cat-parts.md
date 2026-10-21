# 猫耳 / 猫尾部件（给 GPT image，用于第 6 段 "logo → 猫娘"）

> 目的：我们自己画的三角耳朵还是"违和"——因为猫耳不是等腰三角形，它要贴着头的轮廓、
> 边缘带弧度、耳尖略微外撇。这里让模型直接在**官方鲸鱼 logo** 上长出耳朵和尾巴，
> 并且把**长出来的部件单独摆一份**，我把它们描成矢量路径（或直接当贴图）接到动画里。
>
> 交付：两张图（或一张图里左右两栏）。存 `assets/character/raw/cat-parts_*.png`。

---

## 图 1：完整状态（logo + 耳朵 + 尾巴），只作参考和对位依据

```
A flat vector-style icon: the DeepSeek whale mark, exactly as it is (one solid flat
shape, colour #4D6BFE, no outline, no gradients, no shading), but grown into a cat:
- TWO CAT EARS on top of its head. The head is the round mass at the lower left of the
  mark. Each ear is a rounded triangle with slightly concave sides and a softly
  pointed tip, leaning outward; the ear base follows the curve of the head so the ear
  looks grown out of it, not glued on. The left ear sits at the top-left of the head,
  the right ear at the top-right, with a gap of about one ear-width between them.
- ONE CAT TAIL at its rear: a smooth tail that starts at the rear-bottom corner of
  the body, sweeps to the right and curls upward at the tip (a simple S curve, one
  stroke thick at the base and tapering to the tip).
Everything is the SAME single flat colour as the mark, one silhouette, no separation
lines. Background: flat solid magenta #FF00FF. No text, no shadow, no eyes, no
whiskers, no other decoration. The whole icon centred, occupying about 70% of the
canvas.
```

## 图 2：把"加出来的部件"单独摆出来（这是动画要用的）

```
The same design, but the canvas has THREE separate pieces laid out with clear space
between them, all in the same single flat colour #4D6BFE, same shapes and same
proportions as the complete version above:
1. the LEFT cat ear alone,
2. the RIGHT cat ear alone (mirrored),
3. the CAT TAIL alone.
Each piece is drawn as a filled silhouette, no outline, no shading. Do NOT draw the
whale body in this image. Background: flat solid magenta #FF00FF. No text, no labels,
no numbers, no grid, no frames. Pieces evenly spaced, each about 25% of the canvas.
```

## 说明：为什么需要"单独摆一份"

现在的动画里耳朵是**从 0 长出来**的（缩放 + 贴着鲸鱼头顶的轮廓），尾巴是**一笔画出来**的。
如果只有合体图，我没法让部件单独生长；有了单独部件，我可以：

1. 按合体图定出**耳根落点**和**尾巴根部落点**（这两个点必须和鲸鱼轮廓严丝合缝）；
2. 把单独部件描成路径（或裁成透明贴图），在动画里做 scale 0→1 的生长；
3. 尾巴做"描线生长"（按路径长度逐段显示），这样它像是从屁股里**长出来**的，而不是淡入。

## 绘制要求（避免上次的问题）

- 耳朵**不要**等腰三角形；要圆角、侧边略内凹、耳尖微微往外；
- 耳根**压住**鲸鱼的头顶轮廓（重叠 3–5px），不能悬空；
- 尾巴根部要**接在鲸鱼身体后下方的那个角**上，不能浮在旁边；
- 全部**单色**（#4D6BFE）——三色/描边/阴影都会破坏 logo 的识别。
