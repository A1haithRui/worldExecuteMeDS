# 交接文档 — worldExecuteMe · DeepSeek 版 MV

> 给接力的新会话：这份文档是全部上下文。请先读完再动手。
> 最后更新：2026-10-20，第 0–7 段完成，第 8 段起未做。

---

## 1. 这是什么

一首以 DeepSeek 为主题的 MV，曲子是 `world.execute(me);`（Mili），**逐镜 1:1 对照一部 Claude 版参考片**，但配色、角色、logo 全部换成 DeepSeek。

- 项目目录：`G:\CODE\worldExecuteMe\newProj_v1017\`
- 参考片（Claude 版，已拆解研究）：`G:\CODE\worldExecuteMe\world-execute-me-lyric-mv\`
- 参考片的拆解资料：`G:\CODE\worldExecuteMe\claude-version-study\`
- **上一代项目（素材宝库，务必参考）**：`G:\CODE\worldExecuteMe\newProj_v1014\`

用户是**非技术背景**的中文使用者：给建议要带理由，不要甩裸路径，审查素材必须**双击可开**。

---

## 2. 铁律（用户已多次确认，不要改）

| 规则 | 内容 |
|---|---|
| 确定性 | 每一帧必须是歌曲时间 `t` 的纯函数。导出结束会自检 `deterministic: yes/no`，**必须永远是 yes** |
| 时间轴 | `shots/table.js` 的 87 个镜头边界、`data/storyboard-v1.json`、歌词时间戳 = **数据源，不许改** |
| 字幕 | **没有底部字幕条**（"直接梭哈"）。歌词是画面的一部分，用 `src/engine/lyric.js` 的 8 种处理之一 |
| 配色 | 深蓝体系。第 0、1 段**无彩（钢灰）**，颜色在片名镜"点火"时进来，之后保持全彩 |
| 无侧边栏 | 从第 4 段起客户端**不显示左侧边栏**；第 4 段还去掉了输入框 |
| 审查素材 | 任何画面改动后，**立刻**重出 `shots/*.mp4` 并重建 `review/`，否则用户看到的是旧的 |
| 音画同步 | 动画关键帧要**按歌词实际开唱时间**（`lines[n].start`），不要按镜头内手挑的秒数 |
| 不要碰 | `world-execute-me-dsh-pv/`、`world-execute-me-lyric-mv/` |

---

## 3. 当前进度：40 / 87 镜

| 段 | 标题 | 时间 | 镜数 | 状态 |
|---|---|---|---|---|
| 0 | 片头闪光警告页 | −5–0 | 1 | ✅ |
| 1 | 启动 | 0–15.08 | 4 | ✅ |
| 2 | 标题与第一个问题 | 15.08–29.39 | 4 | ✅ |
| 3 | 主歌一：用数学回答 | 29.39–44.62 | 4 | ✅ |
| 4 | 导歌一：设定被切换 | 44.62–59.39 | 4 | ✅ |
| 5 | 副歌一：对话与四张版画 | 59.39–74.16 | 8 | ✅（4 项小修待做，见 §7） |
| 6 | 主歌二：三个名词三张版画 | 74.16–88.93 | 8 | ✅ |
| 7 | 导歌二：设定改的是她本人 | 88.93–103.70 | 7 | ✅ |
| 8 | 副歌二到空线程 | 103.70–125.62 | 11 | ⬜ **下一段** |
| 9 | 越界、第一个错误、扩散 | 125.62–… | 9 | ⬜ |
| 10 | EXECUTION：一台机器，十二圈 | | 4 | ⬜ |
| 11 | 数数与最后一声 | | 7 | ⬜ |
| 12 | 最后副歌：四张版画原位重印，但坏了 | | 7 | ⬜ |
| 13 | LOVE 四句 | | 4 | ⬜ |
| 14 | 结尾：逆向开机 | | 5 | ⬜ |

已渲染：`shots/001_preroll.mp4` … `shots/040_pre2-loop-b.mp4`
叙事时刻：已写 40 / 87

---

## 4. 文件地图

```
newProj_v1017/
  shots/
    table.js          87 镜数据表（id, at, until, lines, moment, ...）★不要改时间
    index.js          SHOTS_DERIVED / shotAt / barBeat / validate
    lyric-plan.js     每镜的歌词处理方案（含 byLine 逐行覆盖、echo 回显）
    s00_preroll.js    第 0 段
    s01_boot.js       第 1 段 4 镜
    s02_title.js      第 2 段 4 镜
    s03_geometry.js   第 3 段 4 镜 + geometry.js（点集/圆/正弦/极限曲线）
    s04_bodies.js     第 4 段主区域：示波器 / 时光隧道 / 合体+推镜
    s04_settings.js   第 4 段 4 镜 ★连续一块屏幕的范式
    ui-settings.js    设置抽屉（通用/身份两页）
    s05_layout.js     第 5 段版式：网格底、四角标注、面板、placeArt、anchor、scaledArt
    s05_bubble.js     第 5 段气泡（herBubble / yourBubble / TYPE 字号常量）
    s05_chorus.js     第 5 段 8 镜（4 界面 + 4 版画）
    plate.js          版画底（平纸 + 套色边框）+ tickRing / bolt / listing
    s06_plates.js     第 6 段 8 镜（剪影填字符 + 校样）
    s07_identity.js   第 7 段 7 镜（身份设置 + 三张控制版画）
    figure.js         角色 PNG 加载（bust / lowlight / silhouette）
    ui-client.js      客户端窗口（chip / 气泡 / 光标 / 发送键；composer:false 可关输入框）
  src/
    main.js           renderFrame；RENDER 表注册每一镜；门禁 Promise.all
    engine/lyric.js   8 种歌词处理：typed/display/power/stamp/margin/curve/embedded/none
    engine/stage.js   合成 + 转场 + 调色；resetCtx（每帧重置）
    engine/grade.js   调色；含 sat（色彩状态 = 全片由灰到彩）
    mv-draw.js        at/layer/stroke/disc/rect/type/halo/ground/loadImages
    assets/whale.js   drawWhale(ctx, cx, cy, width, opts) 官方鲸鱼 path
  tools/
    export.mjs        --from --to --fps --width --height --out | --stills --times
    make-review.mjs   --name --from --to --shots --index → review/ 三件套
    build-storyboard.mjs  生成 STORYBOARD.md + data/shots.js|json
  review/
    index.html        ★人类审查入口，双击打开
    NN-name-{AB,ours,reference}.mp4 / poster-*.jpg / stills-*.jpg
    check-review.mjs 审查页自检
  compareResult/     两片同时间轴对比页 + check-compare.mjs（11 项）
  assets/character/  官方鲸鱼 + 角色四姿势（bust/eye/profile/reach）+ v4 掌心特写
  data/lyrics.json   129 行歌词时间（数据源）
```

---

## 5. 常用命令

```powershell
cd G:\CODE\worldExecuteMe\newProj_v1017

# 渲染单镜（720p30，进 shots/）
node tools/export.mjs --from <秒> --to <秒> --fps 30 --width 1280 --height 720 --out shots/NNN_名字.mp4

# 出静帧（带确定性自检）
node tools/export.mjs --from <秒> --to <秒> --stills out/x --times 1.0,2.0

# 重建一段的审查三件套
node tools/make-review.mjs --name <名> --from <秒> --to <秒> --shots 0NN,0MM --index <段号>

# 自检
node review/check-review.mjs
cd compareResult; node tools/check-compare.mjs
cd ..; node tools/build-storyboard.mjs
```

ffmpeg：`G:\CODE\worldExecuteMe\world-execute-me-lyric-mv\node_modules\ffmpeg-static\ffmpeg.exe`
（本项目**没有** node_modules，脚本用 `createRequire` 从参考项目解析 playwright-core）

---

## 6. 已经踩过的坑（别重复）

1. **确定性 NO**：曾因图片没 await 解码、以及 `createPattern` 收到负索引。现在 `main.js` 门禁 `Promise.all([...])` 必须包含所有素材的 ready promise。
2. **确定性 NO（隐蔽）**：把 1342×1704 立绘**大幅缩到 330px** 时，Chromium 首次降采样路径与后续不同 → 用 `scaledArt(img,w,h)` 预缩放成位图再 blit。**任何大比例缩图都要用它。**
3. **帧间状态泄漏**：`stage.js` 的 `resetCtx` 现在也清 shadow/dash。别在 shot 里设了 shadow 不还原。
4. **模块求值顺序**：`const` 有暂时性死区，**常量要先声明**再被别的常量引用（曾因此整页加载失败）。
5. **音画不同步**：拼接 AAC 时每段有 1024 样本补齐，累积会漂移。`make-review.mjs` 已按分镜表**精确裁剪**后再拼（83ms → 13ms）。
6. **气泡重复**：不要让"气泡"和"底部标题"同时显示同一句歌词。
7. **回显歌词**：`lyric-plan.js` 的 `echo` 只在 `byLine` 给上一句指定了位置时才生效，否则会叠印。
8. **版画别用浅色纸**：全片已有片名一处大面积白闪，安全网关为它存在；再加大面积亮切会变成未登记的闪光事件。

---

## 7. 第 5 段最近一轮修的（已完成，了解即可）

1. **STIMULATIONS 的拟合关系** → 重写：7 个**带噪声的采样点** → 虚线按顺序连成"绕远的路" → **最小二乘拟合**出一条直线穿过这些点 → 画出每个点到拟合线的**残差短线**。直线现在是虚线的趋势，不是第二张图。
2. **删掉** logo 下的 `deepseek` 文字、`c1-happy` 的 `me`、`c1-trap` 的计数 `2`。
3. **气泡 `✓ Delivered` 被下一个气泡覆盖** → tick 移进气泡内部（`herBubble` 预留 `tickH = 34px`），并拉开 c1-only / c1-trap 的气泡间距。
4. **音画不同步** → 音频本身没问题（拼接后只差 13–21ms，且不累积）。真因是**气泡出现时间按镜头内手挑的秒数写的**，第二句歌词晚了 1.35 秒。现全部用 `cue(t, n)` 按 `lines[n].start` 触发。

---

## 8. 下一段：第 8 段「副歌二到空线程」11 镜（103.70–125.62，22 秒）

全片情绪核心。参考片的设计（`claude-version-study/data/shots.json` 里 section 8）：

| 镜 | 时间 | 内容 |
|---|---|---|
| c2-typing | 103.70–106.24 | 用户开始打字，三个点；她被打断、重说一句，火花开始旋转 |
| c2-dots | 106.24–107.39 | 打字停了，三个点还在颤；那是她能感到的关于用户的全部 |
| c2-brb | 107.39–110.16 | 三个点变成一句 "brb"，指针离开窗口；她的花瓣一片片合拢成环 |
| c2-complete | 110.16–110.85 | 第十二片花瓣合上——输入收到，可以回答 |
| left-online | 110.85–112.93 | 她对着沉默说了两次话，没有回应；chip 还写着 online |
| left-away | 112.93–114.78 | 半小时、三小时：chip 变 away，**颜色开始离开，先离开头发** |
| left-offline | 114.78–117.31 | 一天、九天：chip 变 offline，她退开一点、低头；**没有标题也没有输入框** |
| left-isolation | 117.31–118.47 | 从很远处看，整条线程只是一个点 |
| alone-erase | 118.47–121.70 | 她开始**删掉自己没人回的消息**，删完留下灰色小段 |
| alone-empty | 121.70–124.70 | 小段也没了，只剩一句她自己没说完的话 |
| alone-eye | 124.70–125.62 | 暗下来，**她第一次睁眼看向我们** |

素材提示：
- `assets/character/deepseek_eye_v3.png` —— **睁眼**那镜用的就是它
- `assets/character/v4/deepseek_reach_v4_body_layer.png` + `_hand_layer.png` —— 伸手的分层（第 8 段"她伸手绕过窗口一角"用得上）
- `deepseek_bust_v4_silhouette.png` / `_lowlight.png` —— 颜色离开、只剩剪影

---

## 9. 工作方式（用户认可的节奏）

1. 先**看参考片**对应镜头（`node -e` 读 `claude-version-study/data/shots.json` 的 section，或直接从 `study_720p30.mp4` 抽帧）
2. **先给方案**（怎么拍、用什么素材、为什么），再动手
3. 实现 → 出静帧自查 → 出片 → 重建 `review/` → 跑三项自检 → 提交推送（**每段一个 commit**）
4. commit message 用英文写"为什么"，正文里写清楚这一轮改了什么
5. 交付时给用户：一张接触印相图 + 逐条说明改了什么 + 让他看哪个文件

**用户反馈往往很具体**（"这个字太小""这个位置偏了""这个效果不够炫"），照做即可，但要**说清根因**，不要只说"改好了"。

---

## 10. git

- 远端 SSH：`git@github.com:A1haithRui/worldExecuteMeDS.git`（HTTPS 到 github.com:443 被墙）
- 分支 `main`，每段完成即 push
- 最近提交：`81c6858`（第 5 段版画加强 + 确定性修复）
