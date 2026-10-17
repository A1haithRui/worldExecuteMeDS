# newProj_v1017 · DeepSeek 版，按参考片结构重做

目标不是"再做一个 MV"，而是**用参考片已经跑通的结构重做一版 DeepSeek 风格的内容**：同一首音频、同一套段落划分、同一个镜头 id（87 个槽位一一对应），因此两支片子可以直接放在同一条时间轴上逐镜对比。

参考片：`../world-execute-me-lyric-mv`（Claude 歌词 MV 第四版，87 镜 / 15 段），解剖结论在 [`../claude-version-study/ANALYSIS.md`](../claude-version-study/ANALYSIS.md)。

## 现在有什么

| 东西 | 状态 |
| --- | --- |
| 87 镜镜像表 `shots/table.js` | 已建立，id/时间/歌词行与参考片一一对应 |
| 分镜表 `STORYBOARD.md` | 由代码生成，含四项结构自检 |
| 音频地图 `tools/audio-map.mjs` | 按小节打印能量/起音/歌词分布，用于定段落边界 |
| 对比页 `compareResult/index.html` | 两边同轴播放 + 逐镜对比，已通过 10 项检查 |
| 引擎与基础设施 `src/engine/`、`src/mv-draw.js`、`server.mjs` | 从 v1014 移植 |
| 渲染入口 `src/main.js`、`index.html` | **还没有**——下一轮写 |
| 87 镜的画面 | **还没有**——逐段实现，先做 0 片头和 1 启动 |

所以现在能做的是**审结构**和**看对比**，还不能预览新画面。

## 怎么用

```bash
# 分镜表 + 数据（改了 shots/table.js 之后跑）
node tools/build-storyboard.mjs

# 音频结构地图（选段落边界用）
node tools/audio-map.mjs --summary
node tools/audio-map.mjs --from 56 --to 72

# 对比页：双击 compareResult/index.html 即可，不需要服务
#   自动检查（需要 Chrome）：
node compareResult/tools/check-compare.mjs
```

对比页左右两边由 `compareResult/config.js` 指定。等我们自己开始出片后，把 `right.file` 指向新导出、`right.preroll` 改成 5，对比就自动对齐。

## 两个决定，都写进了代码

**1｜时间用我们的网格，不照抄它的。**

我们和参考片的**拍位相同**（130 BPM，一小节 1.8462 s），但**网格相位不同**：它用 0.344 s，我们的音频分析给 0.310 s。

实测判断依据：音频里最强的 40 个底鼓起始点，相对我们的相位落在网格点**之后** 1–33 ms（正是起音检测的正常延迟），相对它的相位则全部落在网格点**之前** 10–37 ms。所以我们的相位才是贴合鼓点的那个。

因此 `shots/table.js` 里每个切点 = 参考片的拍位 + 我们的相位，整体前移 0.034 s。`tools/import-reference-table.mjs` 记录了这件事，`STORYBOARD.md` 顶部也写着。

**2｜叙事时刻分三种状态。**

每个镜头必须有一句"这是这场对话的哪个时刻"，这是审片时唯一的依据。状态分三档，由自检统计：

- `written`：我们自己写的
- `inherited`：从 `newProj_v1014` 承接过来的，**还没按新节奏重写**
- `todo`：空的

当前：已写 0 · 承接 74（85%）· 待写 13。这个数字就是完成度，改一镜减一个。

## 结构自检（`tools/build-storyboard.mjs` 顺带跑）

- 87 镜首尾相接，无空隙、无重叠
- 每个切点落在半拍网格上（片头警告页与末镜除外，那里没有拍）
- 歌词 129 行全覆盖
- 每个镜头的 `momentState` 合法
- flash 不超过 `config.safety.maxFlash`

## 素材与音频

- `audio/song.wav`：本机工作副本，不进 Git；歌曲版权不属于本仓库。
- `data/lyrics.json`、`data/audio-features-v1.json`：本机生成，不进 Git。
- `assets/character/`：只复制了 **7 张在用的角色图**（约 11 MB）。完整的设计稿、v2/v3 源图、生成记录仍在 `../newProj_v1014/assets/character/`，需要时再去取。
- `assets/fonts/`：字体。

## 下一步

1. 写 `index.html` + `src/main.js` 渲染入口（从 v1014 移植并去掉 p0–p7 的依赖）。
2. 实现 **0 片头：闪光警告页**（5 秒，参考片同款；我们全片闪帧最大跳变 9.93%、阈值 10%，压在线上，这一页必须有）。
3. 逐段实现镜头，每段出片后把剪辑丢进 `shots/`，对比页就能两边同镜对照。
4. 按段把 `inherited` 的时刻改写成 `written`。

## 进度记录

- 2026-10-18：建立镜像表与分镜表；确定网格相位；对比页跑通（10 项检查，两边同步差 19 ms）。
