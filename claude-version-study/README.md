# 参考片分镜解剖 · Claude 版《world.execute(me);》

扒的是隔壁 `world-execute-me-lyric-mv`（Claude 歌词 MV 第四版）：**87 个镜头、15 段**，逐镜切好、可随时 review。

打开方式：**双击 [`index.html`](index.html)**，不需要启动服务（页面只用 `<video>`/`<img>`，没有 fetch 和 ES 模块）。

## 页面上有什么

- 一镜一行：缩图、镜头 id、歌曲时间、**小节:拍**、歌词行、颜色状态、时长。
- 点任意一行 → 播放该镜剪辑（带声音，前后各留 0.1 秒），左侧面板显示它的分镜信息：成片时间、进入／离开转场、构图，以及作者自己写的那句"这是这场对话的哪个时刻"。
- 上一镜 / 下一镜 / 重播 / 自动连播；键盘 `←` `→` `空格`。
- 顶部是参考片自己的四项自检结果；底部是段落总表和"这个分镜表是怎么组织的"。

## 数据是怎么来的

不是解析 Markdown 表格，而是**直接导入参考片的镜头清单**（它的 `buildShots()` 在 Node 下可运行，只要构建清单时不碰 DOM）：

```
node tools/extract-shots.mjs   # → data/shots.json（87 镜的 id/时间/歌词行/时刻/构图/状态/转场）
```

剪辑来自参考片自己渲染的全片：

```
cd ../world-execute-me-lyric-mv
node export/export.mjs --width 1280 --height 720 --fps 30 --out out/study_720p30.mp4
cd ../claude-version-study
node tools/cut-shots.mjs       # → shots/*.mp4 与 thumbs/*.jpg，并逐镜校验时长
node tools/build-page.mjs      # → index.html
node tools/check-page.mjs      # 用真实 Chrome 以 file:// 打开，9 项检查
```

成片包含参考片自己的 5 秒无声警告页，所以 **成片时间 = 歌曲时间 + 5**；所有剪辑都按成片时间切，`data/shots.json` 里两个时间都记着。

## 版本与版权

- 来源：`world-execute-me-lyric-mv`，commit `2073b0c88c6fc837482478402a44f101b3b57d6f`（本页顶部也记着）。
- 代码与文档该仓库声明为 MIT；角色剪影等美术为 CC BY-NC-SA 4.0。这里只做**本地学习用途**的渲染与切片。
- 因此 `shots/`、`thumbs/`、`study-page-shot.png` 与那张 720p 全片**不进 Git**（见仓库根 `.gitignore`）：它们是从他人作品派生的媒体。进版本管理的是本 README、`tools/`、`index.html`、`data/shots.json`。
