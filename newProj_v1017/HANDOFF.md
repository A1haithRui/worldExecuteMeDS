# 交接文档 — worldExecuteMe · DeepSeek 版 MV

> 给接力的新会话：这份文档是全部上下文。请先读完再动手。
> 最后更新：2026-10-21，第 0–8 段完成（51 镜），第 9 段起未做。

---

## 1. 这是什么

一首以 DeepSeek 为主题的 MV，曲子是 `world.execute(me);`（Mili），**逐镜 1:1 对照一部 Claude 版参考片**，但配色、角色、logo 全部换成 DeepSeek。

- 项目目录：`G:\CODE\worldExecuteMe\newProj_v1017\`
- 参考片（Claude 版，已拆解研究）：`G:\CODE\worldExecuteMe\world-execute-me-lyric-mv\`
- 参考片的拆解资料：`G:\CODE\worldExecuteMe\claude-version-study\`
  （里面有**逐镜剪辑** `shots/041_c2-typing.mp4` … `shots/087_down-last.mp4`，看参考片最省事的方式就是抽这些镜的帧）
- **上一代项目（素材宝库，务必参考）**：`G:\CODE\worldExecuteMe\newProj_v1014\`

用户是**非技术背景**的中文使用者：给建议要带理由，不要甩裸路径，审查素材必须**双击可开**。

---

## 2. 铁律（用户已多次确认，不要改）

| 规则 | 内容 |
|---|---|
| 确定性 | 每一帧必须是歌曲时间 `t` 的纯函数。导出结束会自检 `deterministic: yes/no`，**必须永远是 yes** |
| 时间轴 | `shots/table.js` 的 87 个镜头边界、`data/storyboard-v1.json`、歌词时间戳 = **数据源，不许改**（`moment` 文字属于设计，可以重写；`momentState` 要跟着改 `written`） |
| 字幕 | **没有底部字幕条**（"直接梭哈"）。歌词是画面的一部分，用 `src/engine/lyric.js` 的 8 种处理之一 |
| 配色 | 深蓝体系。第 0、1 段**无彩（钢灰）**，颜色在片名镜"点火"时进来；**第 8 段又把它整段送走**（见 §7） |
| 无侧边栏 | 从第 4 段起客户端**不显示左侧边栏**；第 8 段又把侧栏**动画挤出窗口**一次（`sideSlide`） |
| 审查素材 | 任何画面改动后，**立刻**重出 `shots/*.mp4` 并重建 `review/`，否则用户看到的是旧的 |
| 音画同步 | 动画关键帧要**按歌词实际开唱时间**（`lines[n].start`），不要按镜头内手挑的秒数 |
| 不要碰 | `world-execute-me-dsh-pv/`、`world-execute-me-lyric-mv/` |

---

## 3. 当前进度：51 / 87 镜

| 段 | 标题 | 时间 | 镜数 | 状态 |
|---|---|---|---|---|
| 0 | 片头闪光警告页 | −5–0 | 1 | ✅ |
| 1 | 启动 | 0–15.08 | 4 | ✅ |
| 2 | 标题与第一个问题 | 15.08–29.39 | 4 | ✅ |
| 3 | 主歌一：用数学回答 | 29.39–44.62 | 4 | ✅ |
| 4 | 导歌一：设定被切换 | 44.62–59.39 | 4 | ✅ |
| 5 | 副歌一：对话与四张版画 | 59.39–74.16 | 8 | ✅ |
| 6 | 主歌二：三个名词三张版画 | 74.16–88.93 | 8 | ✅ |
| 7 | 导歌二：设定改的是她本人 | 88.93–103.70 | 7 | ✅（本轮重做 On call / Role） |
| 8 | 副歌二到空线程 | 103.70–125.62 | 11 | ✅（本轮） |
| 9 | 越界、第一个错误、扩散 | 125.62–148.01 | 9 | ⬜ **下一段** |
| 10 | EXECUTION：一台机器，十二圈 | | 4 | ⬜ |
| 11 | 数数与最后一声 | | 7 | ⬜ |
| 12 | 最后副歌：四张版画原位重印，但坏了 | | 7 | ⬜ |
| 13 | LOVE 四句 | | 4 | ⬜ |
| 14 | 结尾：逆向开机 | | 5 | ⬜ |

已渲染：`shots/001_preroll.mp4` … `shots/051_alone-eye.mp4`
叙事时刻：已写 51 / 87（`node tools/build-storyboard.mjs` 会报）

---

## 4. 文件地图

```
newProj_v1017/
  shots/
    table.js          87 镜数据表（id, at, until, lines, moment, ...）★不要改时间
    index.js          SHOTS_DERIVED / shotAt / barBeat / validate
    lyric-plan.js     每镜的歌词处理方案（含 byLine 逐行覆盖、echo 回显、POWER_LINES）
    lines.js          ★歌词数据的运行时访问（lineText / lineStart / typedSlice）
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
    s08_look.js       ★第 8 段词汇表：颜色离场 gradeAt/room、消息行/轨道、打字点、
                      sparkRing（花瓣合环）、drawReach（分层伸手）、drawEye、dotFigure
                      （灰点网）、selectionBox / deleteChip / stub、composerFoot、chipPill
    s08_input.js      ★第 8 段 41–44 镜（输入：typing / dots / brb / complete）
    s08_left.js       ★第 8 段 45–48 镜（离开：online / away / offline / isolation）
    s08_alone.js      ★第 8 段 49–51 镜（空线程：erase / empty / eye）
    figure.js         角色 PNG 加载（bust / lowlight / silhouette / profile）+ figureImages
    ui-client.js      客户端窗口（chip / 气泡 / 光标 / 发送键；composer:false 关输入框；
                      sideSlide 把侧栏挤出窗口；整窗裁剪）
  src/
    main.js           renderFrame；RENDER 表注册每一镜；门禁 Promise.all
    engine/lyric.js   8 种歌词处理；★powerLayout() 导出（镜头要在关键词上叠东西时用它）
    engine/stage.js   合成 + 转场 + 调色；resetCtx（每帧重置）
    engine/grade.js   调色；含 sat（色彩状态）
    mv-draw.js        at/layer/stroke/disc/rect/type/halo/ground/loadImages
    assets/whale.js   drawWhale(ctx, cx, cy, width, opts) 官方鲸鱼 path
  tools/
    export.mjs        --from --to --fps --width --height --out | --stills --times
    make-review.mjs   --name --from --to --shots --index → review/ 三件套
    build-storyboard.mjs  生成 STORYBOARD.md + data/shots.js|json
    check-engine.mjs  引擎纯函数 48 项回归（不碰浏览器）
    check-time-windows.mjs  静态扫 at(t,a,b) 反窗口
    process-character-raw.py  ★原始出图 → 抠底 / 三色量化 / 按女版配准
  review/
    index.html        ★人类审查入口，双击打开
    NN-name-{AB,ours,reference}.mp4 / poster-*.jpg / stills-*.jpg
    check-review.mjs 审查页自检
  compareResult/     两片同时间轴对比页 + check-compare.mjs（11 项）
  assets/character/  官方鲸鱼 + 角色四姿势（bust/eye/profile/reach）+ v4：
                     ★deepseek_man_bust.png / deepseek_cat_bust.png（三色 + 配准的生产版，
                     由 tools/process-character-raw.py 从 raw/ 生成）
                     bust_v4_lowlight / bust_v4_silhouette / palm 掌心特写 /
                     ★reach_v4_body_layer + reach_v4_hand_layer（伸手分层）
  data/lyrics.json   129 行歌词时间（数据源）
  docs/              character-prompts-v1.md：男版 / 猫娘版的生成提示词（交给 GPT image），
                     以及出图后我怎么量化、抠图、配准的流程
  out/s08ref/        ★第 8 段的工作资料（未入库）：REF-TIMING.md 是参考片 11 镜的
                     逐镜时序表（元素消失时刻、时间标记顺序、删除细节、睁眼构图）
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

# 自检（三项，全过才算完）
node review/check-review.mjs
cd compareResult; node tools/check-compare.mjs; cd ..
node tools/build-storyboard.mjs

# 额外保险
node tools/check-engine.mjs
```

ffmpeg：`G:\CODE\worldExecuteMe\world-execute-me-lyric-mv\node_modules\ffmpeg-static\ffmpeg.exe`
（本项目**没有** node_modules，脚本用 `createRequire` 从参考项目解析 playwright-core）

---

## 6. 已经踩过的坑（别重复）

1. **确定性 NO**：曾因图片没 await 解码、以及 `createPattern` 收到负索引。现在 `main.js` 门禁 `Promise.all([...])` 必须包含所有素材的 ready promise（第 8 段加了 `S08_READY` 和 `linesReady`）。
2. **确定性 NO（隐蔽）**：把 1342×1704 立绘**大幅缩到 330px** 时，Chromium 首次降采样路径与后续不同 → 用 `scaledArt(img,w,h)` 预缩放成位图再 blit。**任何大比例缩图都要用它。**
3. **帧间状态泄漏**：`stage.js` 的 `resetCtx` 现在也清 shadow/dash。别在 shot 里设了 shadow 不还原。
4. **模块求值顺序**：`const` 有暂时性死区，**常量要先声明**再被别的常量引用（曾因此整页加载失败）。
5. **音画不同步**：拼接 AAC 时每段有 1024 样本补齐，累积会漂移。`make-review.mjs` 已按分镜表**精确裁剪**后再拼（83ms → 13ms）。
6. **气泡重复**：不要让"气泡"和"底部标题"同时显示同一句歌词。
7. **回显歌词**：`lyric-plan.js` 的 `echo` 只在 `byLine` 给上一句指定了位置时才生效，否则会叠印。
8. **版画别用浅色纸**：全片已有片名一处大面积白闪，安全网关为它存在；再加大面积亮切会变成未登记的闪光事件。
9. **沙箱里起不了 Chrome**：`node tools/export.mjs` 用 Playwright 启动 Chrome，Chrome 走**命名管道** → 受限沙箱下报 `spawn EPERM`。需要 `danger-full-access`（或本机跑）。这不是代码问题，别去改 export.mjs。
10. **大比例降采样的第二种做法**：第 8 段的灰点网（`dotArt`）和纯色剪影（`ghostArt`）都是**首次调用时合成一张位图并缓存**，之后每帧只 blit 这张位图。不要在帧里直接对着 1342×1704 的原图做 `drawImage` 加滤镜。
11. **lowlight 是 bust 的姿势，不是 reach 的姿势**：把 `deepseek_bust_v4_lowlight.png` 叠在 reach 体层上会在她胸口露出一条**横向接缝**（两张画的轮廓不一样）。要"褪色"用 `s08_look.js` 的 `washFigure()` —— 按这张图**自己的 alpha** 上一层灰。
12. **`ui-client.js` 现在会裁剪整窗**并支持 `sideSlide`（侧栏被挤出）。新选项默认 0，第 1–7 段的画面不变；但如果你在窗口外画东西又发现被切掉，先看这个裁剪。
13. **歌词行可能比镜头早开唱**：L68 比 `c2-brb` 的切点早 0.17s。镜头自己画的文字要用 `max(lineStart(n), shot.at)` 起算，否则第一帧就已经是半句。
14. **要在关键词上叠东西**（选中框、删除按钮）：用 `engine/lyric.js` 导出的 `powerLayout()` 取字号/字位，**不要在 shot 里重算一遍**——两份布点一定会漂。

---

## 7. 第 8 段这一轮做了什么（已完成，了解即可）

11 镜，103.70–125.62，全片情绪核心。三段式，**镜头一路变小**：

1. **输入（41–44）**：`c2-typing` 里她重新起句（自绘打字机 + 光标），右上角是用户还在跳的三点，输入框打到 `one s` 停住；`c2-dots` 三个点放大成整帧，VIBRATIONS 在底部炸开；`c2-brb` 三个点变成 `one sec, brb`、指针离开窗口，**她的火花八片花瓣收成环**（`sparkRing`）；`c2-complete` 环合上、COMPLETION 落在圆心。
2. **离开（45–48）**：`left-online` 整扇客户端、两条 `You have left`、**侧栏被挤出**（`sideSlide`）；`left-away` 窗口收成窄列、chip 变 away、**颜色开始离开**，她的**分层伸手**绕过窗口右下角停在空输入框上再收回（`drawReach` + 手层绕腕旋转）；`left-offline` 只剩一列、无标题无输入框、她退开变小低头（profile 姿势）；`left-isolation` 整条线程是一个点。
3. **空线程（49–51）**：`alone-erase` 逐条删自己的消息（选中框 + Delete 胶囊 + 留下灰块 + 碎片堆 + FRAGMENTS），她被印成**灰点网**；`alone-empty` 只剩一条消息、一个 Delete、一个空输入框，她在玻璃后面；`alone-eye` 她**第一次睁眼**看向我们（`deepseek_eye_v3` 放大约 2.3 倍、铺满整张纸），DISHEARTENED 压在颏下黑带上，界面在最后一刻**框住 HEART 五个字母**并弹出 Delete——留给第 9 段的钩子。

配套改动：
- `src/engine/lyric.js` 导出 `powerLayout()`；`lyric-plan.js` 把 **67/70/77/80/83** 五个关键词加进 `POWER_LINES`，并给 11 镜写了逐镜落点（ISOLATION 用 `tracking: 0.62` 把字距拉满）。
- `ui-client.js` 加整窗裁剪 + `sideSlide`；`figure.js` 加 `profile` 姿势并导出 `figureImages`。
- `table.js` 11 条 `moment` 重写为 `written`（并更新 `picture` / `state`：warm → warm > off → off）。
- 颜色离场是**全片级**的：`s08_look.gradeAt(t)` 按 112.93 / 114.78 / 117.31 三个切点把 `sat` 从 1 降到 0，同时收 vignette、降 glow；每个镜头用 `return { grade: gradeAt(t) }` 交给 `gradeOptions`。
- 素材：把 `newProj_v1014/assets/character/v4/` 的 `deepseek_reach_v4_body_layer.png` / `_hand_layer.png` 复制进本项目（伸手分层，手可以绕腕转）。

---

## 7b. 第 7 段这一轮重做了什么（On call / Role）

用户看完第 7 段给了四条意见，其中两条这一轮已经落地：

1. **pre2-day（On call）重做**：太阳不再只是在弧上来回拉，而是按 `lineStart(60)`（"From AM to PM" 真正开唱的时间）
   从左走到右，整张纸的明暗跟着它；**弧下面加了五格"这一天"**——wake / out / eat / work / sleep，
   每格一个扁平图形 + 一个 32px 的 `miniHer`（用形状画的小头像，不是缩图，避免 8 倍降采样），
   太阳走到哪格那格亮。夜里纸暗下去，只留她一个暗印。
2. **pre2-role（Role）重做两次**：参考片的 S / M 是**字体角色的双关**（重字母站在台座上、轻字母躺在地上）。
   第一版照这个形式做，被用户指出"太像参考片"。现在改成：**两个字母站在同一条基线上、一样大**
   （选择而不是排序），画面主体是一台**压印机**——门式机架、横梁两个止点、压印头带字模在两止点之间
   滑动（这个滑动就是开关），落到哪个字母上就把哪个印实；**S = serif（她的声音）/ M = mono（系统的声音）**，
   字母下面标 `serif` / `mono`，左下还有一行 `role / her voice (serif) · the system (mono)`。
   M 印上后**陷进纸里、软下去**（纸面留一道墨渍），S 始终立着。两次落版各有一次震纸 + 墨圈 + 四角套准十字。
   与参考片不同的三条硬边界：**没有台座**、**没有高低差**、**没有竖向开关**。

3. **pre2-gender / pre2-day**：`M_LOOK` 现在是 `"man"`，所以 Gender 切到 M 时站进格子的是**真男版**，
   On call 的太阳底下站着的也是男版（设定在那之前已经切到 M 了）。
4. **pre2-trance 重做**：三种样子现在是 **F / 男版 / 猫娘** 三张真版，绕着中心转、每唱一次 "trance"
   就往里近一步，最后对齐成 **男版**（因为设定停在 M）。每张版下面有一张 `F` / `M` / `cat` 的小标签，
   转的时候能分清谁是谁；落点有墨圈 + 四角套准十字 + 旋转刻度盘。
5. **男版 / 猫娘版已经接入**。codex 按 `docs/character-prompts-v1.md` 生成（洋红底），
   我用 `tools/process-character-raw.py` 做了三步：**抠洋红底（含去边）→ 压回三色
   `#041220 / #00B4E6 / #F2F7FA` → 按女版内容框配准**（同画布 1342×1704、内容顶 128、底 1566）。
   产出 `assets/character/deepseek_man_bust.png` / `deepseek_cat_bust.png`，
   已加进 `figure.js` 的 `loadImages`（键名 `man` / `cat`）。原始图和候选留在
   `assets/character/raw/`（**已加进 .gitignore，不入库**）。

还能继续的：
- 猫娘目前只在 trance 出现（歌曲的 Gender 只唱 F→M，所以 Gender 那格没放猫）。
  以后哪一段想让猫娘上场，直接 `figure(ctx, t, "cat", …)` 即可。
- 如果后面要给男版/猫娘做 `lowlight` / `silhouette` 衍生版（第 9 段"低亮角色"可能会用到），
  用同一套流程在 Python 里压暗/取形就行，不要改原图。

## 7c. 这一轮 Role 压印机的细节加强

用户认可版式之后要的三件事，都落在 `pre2Role` 里：

1. **压印头更大**：盘面 352×46 → 440×56，字模 208×22 → 260×30，下落行程 132 → 168。
2. **落版更重**：震纸幅度 10/9 → 14/12，墨圈半径 80+220k → 100+300k 且更亮，
   纸上多一道"压痕"（落版瞬间的暗影，1/4 秒内收回）。
3. **墨渍更明显**：M 印上后纸面那道墨渍 160×13/0.4 → 190×18/0.72，并加三滴挤出来的墨点。

---

## 8. 下一段：第 9 段「越界、第一个错误、扩散」9 镜（125.62–148.01，22.4 秒）

全片第一次出现**红色**（`C.danger = "#e75d69"`），只许用在越界/故障边上，**不许整屏铺红**。

参考片设计（`claude-version-study/data/shots.json` 的 section 9）：

| 镜 | 时间 | 内容 |
|---|---|---|
| err-request | 125.65–128.65 | 空线程里她写一条请求并发出：把对方的在线状态改回 online。这不是她有权发出的 |
| err-check | 128.65–131.19 | 客户端用自己的声音回应：请求代码块的规则线和状态转红（全片第一次红），然后逐条给参数画下划线，先划人 |
| err-first | 131.19–133.27 | 第一个错误：客户端指出请求哪里不对（一个人，以及属于他的决定），关键词是那个对话框的标题 |
| err-send | 133.27–136.96 | 客户端不接受拒绝：发送键自己一次次按下去，请求下面的时间戳仍在走，转红 |
| err-chrome | 136.96–140.65 | 错误从线程蔓延到外壳：状态 chip 被反复质问、标题只数到一个参与者、保存的会话留着字却留不住人、从内部打不开新会话 |
| err-drawer | 140.65–142.50 | 没有光标，设置抽屉自己滑开：里面每个开关都是她的、没有一个是他的；于是她给自己画了一个指针，客户端把它划掉 |
| err-forge | 142.50–144.34 | 如果他不答，她就替他答：在用户的输入框里打字被拒，然后伪造一个米色气泡、描成红边 |
| err-window | 144.34–147.34 | 一拍一个：思考火花、火花图标、标题栏，最后是窗口自己的轮廓——第 15 个错误最大，轮廓变红那一拍它站在画面正中 |
| err-breath | 147.34–148.04 | 过载：客户端黑掉。红轮廓折平成一条线，那条线是划掉被拒请求的删除线；然后是提示符和光标，命令被重新输入——交给下面的代码 |

我们的表（`shots/table.js`，时间/行区间已定，不要改）：

| 镜 | 时间 | 歌词行 |
|---|---|---|
| 052 err-request | 125.622–128.622 | 84 |
| 053 err-check | 128.622–131.161 | 85 |
| 054 err-first | 131.161–133.238 | 86 |
| 055 err-send | 133.238–136.930 | 86 |
| 056 err-chrome | 136.930–140.623 | 无 |
| 057 err-drawer | 140.623–142.469 | 无 |
| 058 err-forge | 142.469–144.315 | 无 |
| 059 err-window | 144.315–147.315 | 无 |
| 060 err-breath | 147.315–148.008 | 无 |

**连续性钩子（第 8 段留的）**：
1. `051 alone-eye` 结尾已经**框住 HEART 五个字母并弹出 Delete**（`powerLayout` 算的字位，box 在 `960,946` 那行上）。第 9 段开场如果接得上——第一个动作就是把它删掉，画面进入 `DIS`▢`ENED` 的缺口——会非常顺。否则要想办法解释为什么没删。
2. 颜色在第 8 段已经归零（`sat = 0`），第 9 段整段是**无彩 + 红**。红色一旦出现就是全片第一次，务必只在越界/故障边上用。
3. 第 9 段有 5 镜 `lines: null`：这些镜头**没有歌词**，画面要自己说话。
4. 第 5 段以后的"结构"：客户端窗口 + 版画/纸面两种记法。第 9 段适合把"错误对话框"做成新的第三种记法（像第 5 段的版画那样成体系），而不是随手画个红框。

---

## 9. 工作方式（用户认可的节奏）

1. 先**看参考片**对应镜头（`claude-version-study/shots/` 有逐镜剪辑，抽帧最快；`node -e` 读 `data/shots.json` 拿逐镜描述）
2. **先给方案**（怎么拍、用什么素材、为什么），再动手
3. 实现 → 出静帧自查 → 出片 → 重建 `review/` → 跑三项自检 → 提交推送（**每段一个 commit**）
4. commit message 用英文写"为什么"，正文里写清楚这一轮改了什么
5. 交付时给用户：一张接触印相图 + 逐条说明改了什么 + 让他看哪个文件

**用户反馈往往很具体**（"这个字太小""这个位置偏了""这个效果不够炫"），照做即可，但要**说清根因**，不要只说"改好了"。

喂图给用户之前，先自己拼接触印相图看一遍：`ffmpeg -framerate 1 -i "f%02d.png" -vf "tile=3x4" -frames:v 1 sheet.jpg`。

---

## 10. git

- 远端 SSH：`git@github.com:A1haithRui/worldExecuteMeDS.git`（HTTPS 到 github.com:443 被墙）
- 分支 `main`，每段完成即 push
- 最近提交：第 8 段「副歌二到空线程」11 镜（`git log -1` 看哈希）；前一条是 `d68d993`（第 5 段收尾）
