# world.execute(me); DeepSeek 二创工作区

这是一个独立的社区二创工作区。主要制作目录是 [`newProj_v1014/`](newProj_v1014/)；另外两个目录保留为学习、比较和溯源用的上游源码。它们目前仍各自带有独立的 `.git`，因此尚未作为普通文件纳入总目录的 Git 快照；原始 Git 历史也没有并入总仓库。

| 目录 | 用途 | 原始来源 | 获取时的上游提交 |
| --- | --- | --- | --- |
| [`world-execute-me-dsh-pv/`](world-execute-me-dsh-pv/) | DeepSeek Harness 风格 PV 参考 | [MisakaZentai/world-execute-me-dsh-pv](https://github.com/MisakaZentai/world-execute-me-dsh-pv) | `a598092a1b1db91fa43961a81269353d13419f6f` |
| [`world-execute-me-lyric-mv/`](world-execute-me-lyric-mv/) | Claude 歌词 MV 的浏览器渲染、分镜及角色表现参考 | [Nyankomintsu/world-execute-me-lyric-mv](https://github.com/Nyankomintsu/world-execute-me-lyric-mv) | `2073b0c88c6fc837482478402a44f101b3b57d6f` |
| [`claude-version-study/`](claude-version-study/) | 对上面那份参考片的分镜解剖：87 镜逐镜切片 + 可交互页面 + [分析](claude-version-study/ANALYSIS.md) | 同上 | 同上 |

上游项目的版权和素材说明仍在各自目录的 `LICENSE`、`NOTICE.md`、`CREDITS.md` 及 README 中；在复用代码或素材时应查看相应说明。这个工作区及将来的成片不代表上述作者或 DeepSeek 官方制作、合作或授权。

## 当前进度

2026-10-17：`newProj_v1014/` 全曲 56 镜已接通并导出 1080p60，四条时间驱动缺陷（最后一次呼叫起点、片尾暗环复活、第 5–12 次呼叫未累积、S29 漂移时间反向）已修复，并新增"反向时间窗口"自动守卫；存档标签 `baseline-v1014-fixround1`。审片用 [`newProj_v1014/review/index.html`](newProj_v1014/review/index.html)（双击即开，67 个检查点）。尚未完成：全曲人工审听、逐镜导演精修、两处素材补充。

同日另做了 [`claude-version-study/`](claude-version-study/)：把参考片 87 个镜头逐镜切出来、做成可交互审查页，并写出[解剖结论](claude-version-study/ANALYSIS.md)——其中最有用的两条是"参考片 87 个边界里只有 13 个用成形转场（我们 55 个边界配了 40 条）"，以及"我们的全片闪帧最大跳变 9.93%，阈值 10%，压在线上且没有警告页"。

- `newProj_v1014/assets/character/deepseek_*_v3.png`：当前选定的四张鲸鱼娘角色成品图（透明 PNG）。
- `newProj_v1014/assets/character/v3_sources/`：v3 的生成源图、提示词、制作记录与质量检查。
- `newProj_v1014/assets/character/v4/`：由 v3 提取的低亮、剪影与独立手部素材，以及使用边界和定位记录。
- `newProj_v1014/assets/character/v2_sources/`：前一版设计及标识来源记录，供追溯。
- `MusicFile/`：本机自备音频，不纳入 Git。

`newProj_v1014/` 另有独立的浏览器样片；运行方式见该目录的 README。参考项目中的源码和素材先保持原样，按需汲取渲染、分镜和视觉表现的方法。
