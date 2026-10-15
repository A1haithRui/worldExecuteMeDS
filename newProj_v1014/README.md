# DeepSeek 主题《world.execute(me);》MV 工作目录

目前是可播放的**概念样片**：用 v3 鲸鱼娘角色、深海蓝青配色和聊天界面，把本机音频与歌词时间线接入独立的浏览器预览。全曲分镜已完成第一版，其中 59.223–74.045 秒已接入按歌曲时间绘制的动态试片；其余段落仍沿用早期概念画面，尚未导出正式视频。

![当前浏览器样片](docs/preview.png)

## 本机预览

需要 Node.js。先在这个目录运行 `npm run preview`，再打开 `http://localhost:5174/`。URL 可用 `?t=68.8` 跳到首段动态试片的触点镜头。播放器支持空格和方向键。

本机另需放置：

- `audio/song.wav`：与歌曲时间零点对齐的音频。
- `data/lyrics.json`：与歌曲时间对齐的歌词 JSON，格式沿用参考项目的 `data/lyrics.json`。

这两项只在本机使用，已由总目录 `.gitignore` 排除。没有歌词时仍可看画面和时间线。

## 角色素材

`assets/character/deepseek_{bust,profile,reach,eye}_v3.png` 是当前使用的透明角色图；`v3_sources/` 保存源图、提示词和质量记录。成品素材的设计讨论与品牌素材说明见 `v3_sources/design_notes_v3.md`。

四张基础图与 Claude 版八张素材的用途对照、拟补素材优先级见 [`docs/character-asset-plan.md`](docs/character-asset-plan.md)。

下一阶段的全曲分镜、试做片段和技术路线见 [`docs/production-plan.md`](docs/production-plan.md)。

全曲 56 镜的设计稿见 [`docs/storyboard-v1.md`](docs/storyboard-v1.md)，对应的程序数据在 `data/storyboard-v1.json`；角色补图条件见 [`docs/character-shot-requests-v1.md`](docs/character-shot-requests-v1.md)。镜头切点仍待人工审听。

首段动态试片覆盖分镜 S15–S19（59.223–74.045 秒），复用现有角色与掌心素材。画面由当前播放时间直接计算，方便暂停检查镜头，也方便之后按帧导出。这一段仍是动效和构图试验，时间切点与细节需结合听感调整。

## 参考与后续

这个样片从零实现基础播放器和当前画面，没有直接复制 Claude 版的整套场景代码。后续将参考 `world-execute-me-lyric-mv` 的歌词分镜与过渡方法，以及 `world-execute-me-dsh-pv` 的 DeepSeek 界面与视觉元素，逐段设计完整 MV。
