# DeepSeek 主题《world.execute(me);》MV 工作目录

目前是可播放的**概念样片**：用 v3 鲸鱼娘角色、深海蓝青配色和聊天界面，把本机音频与歌词时间线接入独立的浏览器预览。场景划分与字幕布局仍是草稿，尚未完成正式分镜和视频导出。

![当前浏览器样片](docs/preview.png)

## 本机预览

需要 Node.js。先在这个目录运行 `npm run preview`，再打开 `http://localhost:5174/`。URL 可用 `?t=30` 跳到歌曲第 30 秒。播放器支持空格和方向键。

本机另需放置：

- `audio/song.wav`：与歌曲时间零点对齐的音频。
- `data/lyrics.json`：与歌曲时间对齐的歌词 JSON，格式沿用参考项目的 `data/lyrics.json`。

这两项只在本机使用，已由总目录 `.gitignore` 排除。没有歌词时仍可看画面和时间线。

## 角色素材

`assets/character/deepseek_{bust,profile,reach,eye}_v3.png` 是当前使用的透明角色图；`v3_sources/` 保存源图、提示词和质量记录。成品素材的设计讨论与品牌素材说明见 `v3_sources/design_notes_v3.md`。

四张基础图与 Claude 版八张素材的用途对照、拟补素材优先级见 [`docs/character-asset-plan.md`](docs/character-asset-plan.md)。

下一阶段的全曲分镜、试做片段和技术路线见 [`docs/production-plan.md`](docs/production-plan.md)。

## 参考与后续

这个样片从零实现基础播放器和当前画面，没有直接复制 Claude 版的整套场景代码。后续将参考 `world-execute-me-lyric-mv` 的歌词分镜与过渡方法，以及 `world-execute-me-dsh-pv` 的 DeepSeek 界面与视觉元素，逐段设计完整 MV。
