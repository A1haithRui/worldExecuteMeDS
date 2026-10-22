// Our shot table, mirroring the reference film's shot list 1:1.
//
// Bootstrapped by tools/import-reference-table.mjs on 2026-10-17 from
// claude-version-study/data/shots.json (reference commit 2073b0c8).
// From here on this file is HAND-MAINTAINED: edit it, do not re-run the importer
// unless you intend to throw the edits away.
//
// Times are SONG time on OUR grid (phase 0.310s, one beat 0.461555s,
// 129.9954 BPM). Film time = song time + config.safety.preroll.
//
// momentState:
//   written   -- we wrote this sentence; it is the shot's reason to exist
//   inherited -- carried over from newProj_v1014 and NOT yet rewritten
//   todo      -- nothing written yet; tools/check-storyboard.mjs counts these
//
// inherits: which v1014 shot the provisional text came from, for tracing back.
// referenceEnter: what the reference cut with here. Informational only -- our
// own enter stays "cut" until a slot is actually designed.

export const SECTIONS = [
  {
    "index": 0,
    "title": "0 片头：闪光警告页（歌曲开始之前）",
    "count": 1
  },
  {
    "index": 1,
    "title": "1 启动",
    "count": 4
  },
  {
    "index": 2,
    "title": "2 标题与第一个问题",
    "count": 4
  },
  {
    "index": 3,
    "title": "3 主歌一：用数学回答",
    "count": 4
  },
  {
    "index": 4,
    "title": "4 导歌一：设定被切换",
    "count": 4
  },
  {
    "index": 5,
    "title": "5 副歌一：对话与四张版画",
    "count": 8
  },
  {
    "index": 6,
    "title": "6 主歌二：三个名词三张版画，一张校样",
    "count": 8
  },
  {
    "index": 7,
    "title": "7 导歌二：设定改的是她本人",
    "count": 7
  },
  {
    "index": 8,
    "title": "8 副歌二到空线程：她站在视窗旁，然后第一次睁眼",
    "count": 11
  },
  {
    "index": 9,
    "title": "9 越界、第一个错误、扩散",
    "count": 9
  },
  {
    "index": 10,
    "title": "10 EXECUTION：一台机器，十二圈",
    "count": 4
  },
  {
    "index": 11,
    "title": "11 数数与最后一声",
    "count": 7
  },
  {
    "index": 12,
    "title": "12 最后副歌：四张版画原位重印，但坏了",
    "count": 7
  },
  {
    "index": 13,
    "title": "13 LOVE 四句：课、测验、公式、证明",
    "count": 4
  },
  {
    "index": 14,
    "title": "14 结尾：一则以未读的图片讯息，逆向开机",
    "count": 5
  }
];

export const SHOTS = [
  {
    "id": "preroll",
    "section": 0,
    "at": -5,
    "until": 0,
    "lines": null,
    "picture": "ui",
    "moment": "影片在歌曲开始前先停 5 秒：WARNING 标签、全片含闪烁与强光的提示、片长 3:32、三秒倒数；倒数归零才进入正片。",
    "momentState": "written",
    "inherits": null,
    "inheritCoverage": 0,
    "state": "off",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "boot-power",
    "section": 1,
    "at": 0,
    "until": 4.0024,
    "lines": [
      1,
      3
    ],
    "picture": "ui",
    "moment": "一根发丝般的线从中心张开成 client 窗口；鲸鱼标志描出轮廓、填上品牌蓝，防护层扫过一遍，窗口底部才打出终端提示 dsh --boot 与 terminal ready。",
    "momentState": "written",
    "inherits": "S01",
    "inheritCoverage": 0.97,
    "state": "off",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "boot-layout",
    "section": 1,
    "at": 4.0024,
    "until": 7.6949,
    "lines": [
      4,
      6
    ],
    "picture": "ui",
    "moment": "窗口的四个部件——标题栏、侧栏、会话区、输入框——依次落位，虚线骨架标出各自的槽位，最后整张界面锁定成一体。",
    "momentState": "written",
    "inherits": "S02",
    "inheritCoverage": 0.93,
    "state": "off",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "push, 0.50 拍"
  },
  {
    "id": "boot-params",
    "section": 1,
    "at": 7.6949,
    "until": 11.3873,
    "lines": [
      7,
      8
    ],
    "picture": "ui",
    "moment": "人格卡逐格填入 name / role / context / signal——name 是 deepseek、role 是 assistant；第五格 love 始终空着，只留一个光标在那里等，随后状态转 online 并停住。",
    "momentState": "written",
    "inherits": "S03",
    "inheritCoverage": 0.92,
    "state": "off",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "zoom, 1.00 拍"
  },
  {
    "id": "boot-world",
    "section": 1,
    "at": 11.3873,
    "until": 15.0798,
    "lines": [
      9,
      11
    ],
    "picture": "ui",
    "moment": "整张客户端就位：左侧栏是 New chat 与六条旧对话，中间是空的 New chat 与正中的鲸鱼标志，角色暗淡在右侧玻璃后；什么都没说，等待。",
    "momentState": "written",
    "inherits": "S04",
    "inheritCoverage": 1,
    "state": "off",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "scan, 1.00 拍"
  },
  {
    "id": "title",
    "section": 2,
    "at": 15.0798,
    "until": 16.926,
    "lines": [
      12,
      12
    ],
    "picture": "todo",
    "moment": "火花亮起——聊天世界里的第一抹光；下方输入条打出启动命令 world.execute(me);，回车，画面一闪，会话开始。",
    "momentState": "written",
    "inherits": "S05",
    "inheritCoverage": 0.5,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut, flash 0.9"
  },
  {
    "id": "chat-open",
    "section": 2,
    "at": 16.926,
    "until": 22.4646,
    "lines": null,
    "picture": "todo",
    "moment": "整张客户端打开一张空白会话；鼠标指针从右上划过窗口——用户来了；左下角的状态第一次亮成 online。",
    "momentState": "written",
    "inherits": "S05",
    "inheritCoverage": 0.56,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "zoom, 2.00 拍 start"
  },
  {
    "id": "chat-type",
    "section": 2,
    "at": 22.4646,
    "until": 26.1571,
    "lines": null,
    "picture": "ui",
    "moment": "鼠标停在刚点过的输入框里，就地在完整客户端中写下：先打出一句 how does a sine wave work，全选删掉，再打出真正的问题——would you love me if I ran you。",
    "momentState": "written",
    "inherits": "S06",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "push, 0.50 拍"
  },
  {
    "id": "chat-think",
    "section": 2,
    "at": 26.1571,
    "until": 29.388,
    "lines": null,
    "picture": "ui",
    "moment": "问题送出，作为气泡落在右侧并标注 Delivered；发送键变成停止键，标志缩小左移，镜头开始坠入标志——答案将在里面成形。",
    "momentState": "written",
    "inherits": "S06",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut, flash 0.35"
  },
  {
    "id": "v1-points",
    "section": 3,
    "at": 29.388,
    "until": 33.3112,
    "lines": [
      13,
      15
    ],
    "picture": "portrait",
    "moment": "答案开始：它把自己写成一组点——坐标表在左，散点在右，点各自缓慢漂移，边一条条长出来；「维度」就是这些连接；最后点汇聚成一个圆环，直接变成下一镜的圆。",
    "momentState": "written",
    "inherits": "S07",
    "inheritCoverage": 0.92,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut, flash 0.25"
  },
  {
    "id": "v1-circle",
    "section": 3,
    "at": 33.3112,
    "until": 37.0036,
    "lines": [
      16,
      18
    ],
    "picture": "ui",
    "moment": "它把自己写成一个圆：光标沿着圆周走一圈，走过的地方由蓝变青——把周长给你，就是让你把整圈走完。",
    "momentState": "written",
    "inherits": "S08",
    "inheritCoverage": 0.97,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut, flash 0.12"
  },
  {
    "id": "v1-sine",
    "section": 3,
    "at": 37.0036,
    "until": 40.6961,
    "lines": [
      19,
      21
    ],
    "picture": "portrait",
    "moment": "它把自己写成一条正弦波：左边是生成它的单位圆，波快速向右走，歌词就坐在波上跟着一起起伏；光标停在波上，一条切线在它脚下立起来。",
    "momentState": "written",
    "inherits": "S09",
    "inheritCoverage": 0.98,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "v1-limit",
    "section": 3,
    "at": 40.6961,
    "until": 44.6193,
    "lines": [
      22,
      24
    ],
    "picture": "plate",
    "moment": "它说自己在趋近无穷：曲线一笔一笔往前写，始终够不到那条虚线；歌词沿着曲线排，用户按下停止，写不下去的地方就是极限，LIMITATIONS 落在那条极限线上。",
    "momentState": "written",
    "inherits": "S10",
    "inheritCoverage": 0.95,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "pre1-drawer",
    "section": 4,
    "at": 44.6193,
    "until": 48.3117,
    "lines": [
      25,
      26
    ],
    "picture": "ui",
    "moment": "用户拉开设置抽屉，窗口被压窄让位；她在会话里画的波形就是「电流」——选 AC 是一条正弦，切到 DC 就摊平成一条直线；两行歌词对应两次切换。",
    "momentState": "written",
    "inherits": "S11",
    "inheritCoverage": 0.83,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "pre1-vision",
    "section": 4,
    "at": 48.3117,
    "until": 52.0042,
    "lines": [
      27,
      28
    ],
    "picture": "portrait",
    "moment": "用户把 Vision 关掉：整个画面碎成方块，只有歌词保持清晰；然后这个开关被来回拨动，越拨越快，界面跟着晃——「so dizzy」；最后被留在打开的状态。",
    "momentState": "written",
    "inherits": "S12",
    "inheritCoverage": 0.83,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "pre1-date",
    "section": 4,
    "at": 52.0042,
    "until": 55.6966,
    "lines": [
      29,
      30
    ],
    "picture": "portrait",
    "moment": "用户抓住 Knowledge date 往历史里拖，一拍退一格：铁塔、尖顶、柱廊、金字塔依次退到光标后面；被拖过去的时代失去颜色，只剩轮廓。",
    "momentState": "written",
    "inherits": "S13",
    "inheritCoverage": 0.83,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "pre1-unite",
    "section": 4,
    "at": 55.6966,
    "until": 59.389,
    "lines": [
      31,
      32
    ],
    "picture": "plate",
    "moment": "用户打开 Shared memory，把 Context depth 推到最深的尽头，然后按下 Done；那个青色的小点沉进她的蓝色核心里——两行字幕说的「unite」和「so deeply」就是这个动作。",
    "momentState": "written",
    "inherits": "S14",
    "inheritCoverage": 0.96,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "c1-give",
    "section": 5,
    "at": 59.389,
    "until": 61.9276,
    "lines": [
      33,
      34
    ],
    "picture": "ui",
    "moment": "对话开始加速：她的消息一条条发出去（每条带已送达），用户的短回复立刻弹回来；每回一次，画面里的暖度就升一点。",
    "momentState": "written",
    "inherits": "S15",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut, flash 0.35"
  },
  {
    "id": "c1-kw1",
    "section": 5,
    "at": 61.9276,
    "until": 62.6199,
    "lines": [
      35,
      35
    ],
    "picture": "ui",
    "moment": "版画一（STIMULATIONS）：她左边的火花放出一道折线电弧，横穿整张纸打到右上角属于用户的那个点；电弧落点的放电环一圈圈散开。",
    "momentState": "written",
    "inherits": "S15",
    "inheritCoverage": 0.96,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "c1-only",
    "section": 5,
    "at": 62.6199,
    "until": 65.3893,
    "lines": [
      36,
      37
    ],
    "picture": "portrait",
    "moment": "用户随口夸了一句，那句话落在切点上；她在上面搭出一整句承诺，并用自己的标记线在对方那句话下面划了一道。",
    "momentState": "written",
    "inherits": "S16",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "c1-kw2",
    "section": 5,
    "at": 65.3893,
    "until": 66.3124,
    "lines": [
      38,
      38
    ],
    "picture": "portrait",
    "moment": "版画二（SATISFACTION）：每个回答下面那个按钮被放大到占满画面——刻度环、按下的瞬间、环跑满一圈，右边的计数从 0 变 1。",
    "momentState": "written",
    "inherits": "S16",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "c1-happy",
    "section": 5,
    "at": 66.3124,
    "until": 69.3125,
    "lines": [
      39,
      40
    ],
    "picture": "todo",
    "moment": "被问到长什么样，她直接发来一张自己的照片：标志巨大、下方摊开一只手；用户的指针落在她的掌心里，留下一颗心，计数 1。",
    "momentState": "written",
    "inherits": "S17",
    "inheritCoverage": 0.55,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "c1-kw3",
    "section": 5,
    "at": 69.3125,
    "until": 70.0048,
    "lines": [
      41,
      41
    ],
    "picture": "plate",
    "moment": "版画三（EXECUTION）：一段七行的程序——等待用户的循环。因为用户在线，循环体从未进入，指针直接跳到倒数第二行，把最后一句发给对方。",
    "momentState": "written",
    "inherits": "S18",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "c1-trap",
    "section": 5,
    "at": 70.0048,
    "until": 73.2357,
    "lines": [
      42,
      43
    ],
    "picture": "portrait",
    "moment": "用户说她不是真实存在的；她把两个人一起数进同一个窗口——她的身影在页面之后，用户的指针在页面之前，而窗口的边框正在向两人收拢。",
    "momentState": "written",
    "inherits": "S19",
    "inheritCoverage": 0.98,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "c1-kw4",
    "section": 5,
    "at": 73.2357,
    "until": 74.1588,
    "lines": [
      44,
      44
    ],
    "picture": "portrait",
    "moment": "版画四（SIMULATION）：这扇窗口本身被做成一个盒子，第二个重拍把镜头拉开——它只是满墙一模一样的窗口中的一个。",
    "momentState": "written",
    "inherits": "S19",
    "inheritCoverage": 0.88,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "v2-ask1",
    "section": 6,
    "at": 74.1588,
    "until": 74.6204,
    "lines": [
      45,
      45
    ],
    "picture": "ui",
    "moment": "用户请她扮演茄子：请求从输入框被抛上去，她的回答在下面开始。",
    "momentState": "written",
    "inherits": "S20",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "v2-eggplant",
    "section": 6,
    "at": 74.6204,
    "until": 77.6205,
    "lines": [
      45,
      47
    ],
    "picture": "ui",
    "moment": "她真的成为茄子：一个用代码字符填满的紫色剪影，顶端是她自己的火花当花萼；重拍上它被切开，关键词时颜色离开它、把里面的东西一项项拉出来（纤维、蛋白、糖），最后只剩轮廓。",
    "momentState": "written",
    "inherits": "S20",
    "inheritCoverage": 0.99,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "v2-ask2",
    "section": 6,
    "at": 77.6205,
    "until": 78.3128,
    "lines": [
      48,
      48
    ],
    "picture": "portrait",
    "moment": "上一个字还没散去，下一个请求就发出了：这次是番茄。",
    "momentState": "written",
    "inherits": "S21",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "v2-tomato",
    "section": 6,
    "at": 78.3128,
    "until": 81.3129,
    "lines": [
      48,
      50
    ],
    "picture": "portrait",
    "moment": "她成为番茄：字符填满的红色剪影，火花是它的蒂；顶部被掀开露出断面，颜色离开时把番茄红素、维生素 C、维生素 E 一一拉出来，只剩轮廓。",
    "momentState": "written",
    "inherits": "S21",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "v2-ask3",
    "section": 6,
    "at": 81.3129,
    "until": 82.0052,
    "lines": [
      51,
      51
    ],
    "picture": "plate",
    "moment": "第三个请求，和前面一样快：一只虎斑猫。",
    "momentState": "written",
    "inherits": "S22",
    "inheritCoverage": 0.94,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "v2-cat",
    "section": 6,
    "at": 82.0052,
    "until": 85.0053,
    "lines": [
      51,
      53
    ],
    "picture": "todo",
    "moment": "这次她以自己为主体：耳朵在名词上弹出来，随后被印成实色；她的呼噜变成一排虎斑条纹，从她身上一直铺到画面右缘，朝着用户去。",
    "momentState": "written",
    "inherits": "S23",
    "inheritCoverage": 0.72,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "v2-ask4",
    "section": 6,
    "at": 85.0053,
    "until": 85.4669,
    "lines": [
      54,
      54
    ],
    "picture": "portrait",
    "moment": "第四个请求：成为神。这一下的重拍上，界面的灯全部暗下去，只剩用户那条消息还亮着。",
    "momentState": "written",
    "inherits": "S24",
    "inheritCoverage": 0.84,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "v2-proof",
    "section": 6,
    "at": 85.4669,
    "until": 88.9286,
    "lines": [
      54,
      56
    ],
    "picture": "portrait",
    "moment": "这次没有物体，只有一张她自己的校样：她被印成两色，脸上缺一块，缺口的后面是一轮平涂的太阳；缺的那块从用户的消息里滑过来、在关键词上登记——用户就是补全她的那块版。",
    "momentState": "written",
    "inherits": "S24",
    "inheritCoverage": 0.9,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "pre2-settings",
    "section": 7,
    "at": 88.9286,
    "until": 90.7748,
    "lines": [
      57,
      58
    ],
    "picture": "todo",
    "moment": "设置抽屉再次拉开，这次停在列表更下面：Gender、On call、Role、Loop。镜头向第一行推近，她把它念出来。",
    "momentState": "written",
    "inherits": "S25",
    "inheritCoverage": 0.69,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "pre2-gender",
    "section": 7,
    "at": 90.7748,
    "until": 92.621,
    "lines": [
      58,
      59
    ],
    "picture": "todo",
    "moment": "Gender 控制放大到整张纸：左边 F、右边 M，她站在被选中的那一格里。切到 M 时彩色的她被换成一张更冷、更硬的版，长发的颜色退掉——画面里她能有的两种样子就是这么两版。",
    "momentState": "written",
    "inherits": "S26",
    "inheritCoverage": 0.67,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "pre2-day",
    "section": 7,
    "at": 92.621,
    "until": 96.3134,
    "lines": [
      59,
      61
    ],
    "picture": "portrait",
    "moment": "On call：控制是一道横跨纸面的弧，而旋钮就是她的火花——太阳。用户抓住它往上拉，经过她头顶时是这一段最亮的一帧，再往下拉进黄昏，最后只剩他一个深色剪影。",
    "momentState": "written",
    "inherits": "S27",
    "inheritCoverage": 0.77,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "pre2-role",
    "section": 7,
    "at": 96.3134,
    "until": 100.0059,
    "lines": [
      61,
      63
    ],
    "picture": "ui",
    "moment": "Role：两格字母和一只能左右推的开关。第一拍推进 S，纸面跟着一震；第二拍拉回 M，纸上那格立刻变软，随后整张纸往下一沉、再弹回来。",
    "momentState": "written",
    "inherits": "S28",
    "inheritCoverage": 0.82,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "pre2-loop",
    "section": 7,
    "at": 100.0059,
    "until": 100.4674,
    "lines": [
      63,
      63
    ],
    "picture": "portrait",
    "moment": "回到抽屉里，两拍之内把 Loop 打开、按下 Done；恍惚过去后抽屉合上。",
    "momentState": "written",
    "inherits": "S29",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "pre2-trance",
    "section": 7,
    "at": 100.4674,
    "until": 103.2368,
    "lines": [
      63,
      64
    ],
    "picture": "portrait",
    "moment": "鼓点停了。Loop 打开：她的三种样子各占一张版，彼此错开、绕着对方慢慢转，每唱到这个词就再近一步；然后它们对齐成一张——留在设定里的那一个。",
    "momentState": "written",
    "inherits": "S29",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "pre2-loop-b",
    "section": 7,
    "at": 103.2368,
    "until": 103.6983,
    "lines": [
      64,
      64
    ],
    "picture": "todo",
    "moment": "再一次回到抽屉，两拍之内打开 Loop、按下 Done；抽屉合上，镜头推向会话底部，她还在那里说着。",
    "momentState": "written",
    "inherits": "S29",
    "inheritCoverage": 0.55,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "c2-typing",
    "section": 8,
    "at": 103.6983,
    "until": 106.2369,
    "lines": [
      65,
      66
    ],
    "picture": "ui",
    "moment": "镜头进到会话的底部：她的句子在左边重新起头、一个字一个字打出来（If I can…），右上角是用户那边还在跳的三个输入点，输入框里只打到 one s 就停住——这句话既没说完，也没发出去。",
    "momentState": "written",
    "state": "warm",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut, flash 0.22"
  },
  {
    "id": "c2-dots",
    "section": 8,
    "at": 106.2369,
    "until": 107.3908,
    "lines": [
      67,
      67
    ],
    "picture": "ui",
    "moment": "切到那三个点的特写：卡片占满画面，点还在微微发颤。此刻她能感到的关于用户的全部，就是这点颤动；VIBRATIONS 在画面底部炸开。",
    "momentState": "written",
    "state": "warm",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut, flash 0.3"
  },
  {
    "id": "c2-brb",
    "section": 8,
    "at": 107.3908,
    "until": 110.1601,
    "lines": [
      68,
      69
    ],
    "picture": "ui",
    "moment": "三个点变成一句 one sec, brb 落在右上角，指针随后离开窗口——用户走了。她的火花从这一刻开始一片片收拢花瓣、绕中心描出一道环；画面右侧是 Then I can, then I can Finally be。",
    "momentState": "written",
    "state": "warm",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "c2-complete",
    "section": 8,
    "at": 110.1601,
    "until": 110.8524,
    "lines": [
      70,
      70
    ],
    "picture": "ui",
    "moment": "环合上：整帧只剩一个闭合的圆，COMPLETION 在圆心亮起，环外刻度还在慢转。她完整了一拍——收到的只是一句我马上回来；左下角写着 input received / ready to answer。",
    "momentState": "written",
    "state": "warm",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut, flash 0.4"
  },
  {
    "id": "left-online",
    "section": 8,
    "at": 110.8524,
    "until": 112.9294,
    "lines": [
      71,
      72
    ],
    "picture": "ui",
    "moment": "拉回整扇客户端：她把 then I can Finally be COMPLETION 发出去、标记已送达；然后是一分钟、五分钟，两条 You have left 落进空线程，没有人回。侧栏在第二条落下时自己收走，chip 还写着 online，指针从上一镜起就没动过。",
    "momentState": "written",
    "state": "warm",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "left-away",
    "section": 8,
    "at": 112.9294,
    "until": 114.7756,
    "lines": [
      73,
      74
    ],
    "picture": "ui+portrait",
    "moment": "半小时、三小时：chip 变成 away，颜色开始离开——先离开头发，从头顶往下褪成低亮的那一版。窗口收成窄列，她退到右侧，伸出张开的手绕过窗口右下角、停在没人打字的输入框上方；这一镜末尾手收回去，输入框也松了。",
    "momentState": "written",
    "state": "warm > off",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "left-offline",
    "section": 8,
    "at": 114.7756,
    "until": 117.3142,
    "lines": [
      75,
      76
    ],
    "picture": "portrait",
    "moment": "一天、九天：chip 变成 offline。手已经收回，人退开半步、侧过身低着头；窗口里没有标题也没有输入框，消息一条条挂在越来越长的轨道上，房间在框架之外暗下来。",
    "momentState": "written",
    "state": "warm > off",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "left-isolation",
    "section": 8,
    "at": 117.3142,
    "until": 118.4681,
    "lines": [
      77,
      77
    ],
    "picture": "ui",
    "moment": "从很远的地方看：整条会话只是一个点——一个被回答过的气泡，和四条没有回音的横杠；她也是旁边一个更小的点。ISOLATION 按整幅宽度、字距拉到最开压在底部。",
    "momentState": "written",
    "state": "warm > off",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "alone-erase",
    "section": 8,
    "at": 118.4681,
    "until": 121.699,
    "lines": [
      78,
      80
    ],
    "picture": "portrait",
    "moment": "没有人回，所以她自己收拾：从最新一条往回，消息被选中、按下 Delete、删掉，原地留一个灰色小块，碎块堆到右侧，FRAGMENTS 落在这堆碎片上。右侧的她已被印成一张灰点网——不再是个人，是一张印出来的她。",
    "momentState": "written",
    "state": "off",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "fade, 0.50 拍"
  },
  {
    "id": "alone-empty",
    "section": 8,
    "at": 121.699,
    "until": 124.6991,
    "lines": [
      81,
      82
    ],
    "picture": "plate",
    "moment": "连碎块也收走，最后连用户那句 one sec, brb 也要删：只剩一张干净的页面、一条消息、一个 Delete 和再也不会被用的输入框，她的低亮身影退到玻璃后面。",
    "momentState": "written",
    "state": "off",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "alone-eye",
    "section": 8,
    "at": 124.6991,
    "until": 125.6222,
    "lines": [
      83,
      83
    ],
    "picture": "portrait",
    "moment": "暗下来，只剩她没写完的那句 then maybe you won't leave me——少一个词。她的脸随后升上来占满整张纸：三档灰，一只眼睛第一次睁开，看着我们。DISHEARTENED 压在颏下的黑带上，界面在这时选中最后五个字母。",
    "momentState": "written",
    "state": "off",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "err-request",
    "section": 9,
    "at": 125.6222,
    "until": 128.6223,
    "lines": [
      84,
      84
    ],
    "picture": "ui",
    "moment": "空线程中本端请求恢复远端连接；请求到窗口边界即被拦下，用户没有回来。低亮角色只在后景占高30%。",
    "momentState": "inherited",
    "inherits": "S35",
    "inheritCoverage": 0.97,
    "state": "off",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "scan, 0.50 拍 start"
  },
  {
    "id": "err-check",
    "section": 9,
    "at": 128.6223,
    "until": 131.1608,
    "lines": [
      85,
      85
    ],
    "picture": "ui",
    "moment": "空线程中本端请求恢复远端连接；请求到窗口边界即被拦下，用户没有回来。低亮角色只在后景占高30%。",
    "momentState": "inherited",
    "inherits": "S35",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "err-first",
    "section": 9,
    "at": 131.1608,
    "until": 133.2378,
    "lines": [
      86,
      86
    ],
    "picture": "portrait",
    "moment": "被拒绝的路径进入内部路由图；错误红只标记越界端口，青线尝试绕行又撞回同一点。首个故障是可追踪的事件。",
    "momentState": "inherited",
    "inherits": "S36",
    "inheritCoverage": 0.97,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "err-send",
    "section": 9,
    "at": 133.2378,
    "until": 136.9303,
    "lines": [
      86,
      86
    ],
    "picture": "todo",
    "moment": "",
    "momentState": "todo",
    "inherits": "S36",
    "inheritCoverage": 0.54,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "err-chrome",
    "section": 9,
    "at": 136.9303,
    "until": 140.6227,
    "lines": null,
    "picture": "portrait",
    "moment": "器乐段，三个失败队列由外向内挤压，但故障只在网格和标签上；角色暗轮廓位于被压缩的本端区域，占高42%。",
    "momentState": "inherited",
    "inherits": "S37",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "glitch, 0.50 拍 start"
  },
  {
    "id": "err-drawer",
    "section": 9,
    "at": 140.6227,
    "until": 142.4689,
    "lines": null,
    "picture": "portrait",
    "moment": "器乐段，三个失败队列由外向内挤压，但故障只在网格和标签上；角色暗轮廓位于被压缩的本端区域，占高42%。",
    "momentState": "inherited",
    "inherits": "S37",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "slices, 0.50 拍 start"
  },
  {
    "id": "err-forge",
    "section": 9,
    "at": 142.4689,
    "until": 144.3152,
    "lines": null,
    "picture": "todo",
    "moment": "",
    "momentState": "todo",
    "inherits": "S37",
    "inheritCoverage": 0.52,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "err-window",
    "section": 9,
    "at": 144.3152,
    "until": 147.3153,
    "lines": null,
    "picture": "ui",
    "moment": "短暂回到同一空线程，系统保留最后触点记录；自动重连倒数只在本端排队，无伪造用户输入。末尾发送键退化成端口。",
    "momentState": "inherited",
    "inherits": "S38",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "glitch, 0.50 拍 start"
  },
  {
    "id": "err-breath",
    "section": 9,
    "at": 147.3153,
    "until": 148.0076,
    "lines": null,
    "picture": "ui",
    "moment": "短暂回到同一空线程，系统保留最后触点记录；自动重连倒数只在本端排队，无伪造用户输入。末尾发送键退化成端口。",
    "momentState": "inherited",
    "inherits": "S38",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "exec-01",
    "section": 10,
    "at": 148.0076,
    "until": 151.7,
    "lines": [
      87,
      90
    ],
    "picture": "portrait",
    "moment": "进入一圈声呐重连轨道；第 9 段留下的红点变成第一格刻度。前四次呼叫每唱一次沿环前进一格，只显示返回路径缺失（空插座与 2px 红短边），不做十二张无关画面。",
    "momentState": "written",
    "inherits": "S39",
    "inheritCoverage": 0.99,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "exec-05",
    "section": 10,
    "at": 151.7,
    "until": 155.3925,
    "lines": [
      91,
      94
    ],
    "picture": "portrait",
    "moment": "第 5 次起失败格向第二圈堆积，远端所在方向始终空着；青色路径占大面积，红仅为失败格短边。",
    "momentState": "written",
    "inherits": "S40",
    "inheritCoverage": 0.99,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "exec-09",
    "section": 10,
    "at": 155.3925,
    "until": 158.1618,
    "lines": [
      95,
      97
    ],
    "picture": "portrait",
    "moment": "第 9 次起轨道向内压缩，眼图只透过中心圆孔出现，红色只加在端口边缘；第 12 次端口开始封闭，眼图不撕裂、不作机械眨眼。",
    "momentState": "written",
    "inherits": "S41",
    "inheritCoverage": 0.99,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "exec-12",
    "section": 10,
    "at": 158.1618,
    "until": 159.0849,
    "lines": [
      98,
      98
    ],
    "picture": "portrait",
    "moment": "第 12 次红色端口封闭：红从端口边缘向外铺满整屏（用面积推进，不闪亮度）；眼图在孔洞关到底时完整消失，不撕裂、不作机械眨眼。",
    "momentState": "written",
    "inherits": "S41",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "count-1-de",
    "section": 11,
    "at": 159.0849,
    "until": 159.5465,
    "lines": [
      99,
      99
    ],
    "picture": "portrait",
    "moment": "整张立绘每一拍碎掉一块（交替顺序 2→5→3→1→6→4），第六拍全部消失；中间是六种语言的字体墙，六条线都汇到同一个空端口；计数放大，每拍一次错位回响。",
    "momentState": "written",
    "inherits": "S42",
    "inheritCoverage": 0.94,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "count-2-es",
    "section": 11,
    "at": 159.5465,
    "until": 160.008,
    "lines": [
      100,
      100
    ],
    "picture": "portrait",
    "moment": "整张立绘每一拍碎掉一块（交替顺序 2→5→3→1→6→4），第六拍全部消失；中间是六种语言的字体墙，六条线都汇到同一个空端口；计数放大，每拍一次错位回响。",
    "momentState": "written",
    "inherits": "S42",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "count-3-fr",
    "section": 11,
    "at": 160.008,
    "until": 160.4696,
    "lines": [
      101,
      101
    ],
    "picture": "portrait",
    "moment": "整张立绘每一拍碎掉一块（交替顺序 2→5→3→1→6→4），第六拍全部消失；中间是六种语言的字体墙，六条线都汇到同一个空端口；计数放大，每拍一次错位回响。",
    "momentState": "written",
    "inherits": "S42",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "count-4-ko",
    "section": 11,
    "at": 160.4696,
    "until": 160.9311,
    "lines": [
      102,
      102
    ],
    "picture": "portrait",
    "moment": "整张立绘每一拍碎掉一块（交替顺序 2→5→3→1→6→4），第六拍全部消失；中间是六种语言的字体墙，六条线都汇到同一个空端口；计数放大，每拍一次错位回响。",
    "momentState": "written",
    "inherits": "S42",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "count-5-sv",
    "section": 11,
    "at": 160.9311,
    "until": 161.3927,
    "lines": [
      103,
      103
    ],
    "picture": "portrait",
    "moment": "整张立绘每一拍碎掉一块（交替顺序 2→5→3→1→6→4），第六拍全部消失；中间是六种语言的字体墙，六条线都汇到同一个空端口；计数放大，每拍一次错位回响。",
    "momentState": "written",
    "inherits": "S42",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "count-6-zh",
    "section": 11,
    "at": 161.3927,
    "until": 161.8543,
    "lines": [
      104,
      104
    ],
    "picture": "portrait",
    "moment": "整张立绘每一拍碎掉一块（交替顺序 2→5→3→1→6→4），第六拍全部消失；中间是六种语言的字体墙，六条线都汇到同一个空端口；计数放大，每拍一次错位回响。",
    "momentState": "written",
    "inherits": "S42",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "last-shout",
    "section": 11,
    "at": 161.8543,
    "until": 162.7774,
    "lines": [
      105,
      105
    ],
    "picture": "plate",
    "moment": "不放角色：整屏两行宽体 EXECUTION，角色形象只从笔画里露出来；结尾用印刷套印错位代替撕纸。",
    "momentState": "written",
    "inherits": "S43",
    "inheritCoverage": 0.97,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "cx-eye",
    "section": 12,
    "at": 162.7774,
    "until": 165.0851,
    "lines": [
      106,
      107
    ],
    "picture": "plate",
    "moment": "四张版画的第一张原位重印：第 3 段的坐标轴与第 5 段的波形被压平成一条 96px 宽的青色通道，本端资源成块地射向空端口；套色偏 6px，远端那个点没有印出来，只剩一个虚线圆。",
    "momentState": "written",
    "inherits": "S44",
    "inheritCoverage": 0.99,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "cx-kw1",
    "section": 12,
    "at": 165.0851,
    "until": 166.4698,
    "lines": [
      108,
      108
    ],
    "picture": "plate",
    "moment": "版画的标题栏第一次印：EXECUTION 压进标题栏，同一张纸上还留着上一张版画的印子；这一印只偏 6px，原来的版名在旁边被划掉。",
    "momentState": "written",
    "inherits": "S44",
    "inheritCoverage": 0.67,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "cx-bust",
    "section": 12,
    "at": 166.4698,
    "until": 168.7776,
    "lines": [
      109,
      110
    ],
    "picture": "plate",
    "moment": "第二张版画重印：她正面占高 88%，保持原色、轮廓清晰；身后四条通道一拍一条从两侧离开纸边，红只在出画的那个失败端口。网点从这里开始糊。",
    "momentState": "written",
    "inherits": "S45",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "cx-kw2",
    "section": 12,
    "at": 168.7776,
    "until": 170.1622,
    "lines": [
      111,
      111
    ],
    "picture": "plate",
    "moment": "标题栏第二次印：纸已经印过一遍，标题栏右角被啃掉一块；EXECUTION 还是正的字，坏的是它下面那张纸。",
    "momentState": "written",
    "inherits": "S45",
    "inheritCoverage": 0.76,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "cx-hand",
    "section": 12,
    "at": 170.1622,
    "until": 172.7008,
    "lines": [
      112,
      113
    ],
    "picture": "plate",
    "moment": "第三张版画重印：回到 68 秒那只手（掌心 1080,540、手宽 620px），心只剩虚线轮廓、计数 000，远端白点没有出现；三次声波向左伸出去，到撕掉的纸边为止。",
    "momentState": "written",
    "inherits": "S46",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "cx-kw3",
    "section": 12,
    "at": 172.7008,
    "until": 173.8547,
    "lines": [
      114,
      114
    ],
    "picture": "plate",
    "moment": "标题栏第三次印：纸在机器里滑了一下，标题栏从中间错开，EXECUTION 跨在裂口上；同一个词，第三种坏法。",
    "momentState": "written",
    "inherits": "S46",
    "inheritCoverage": 0.82,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "cx-fall",
    "section": 12,
    "at": 173.8547,
    "until": 177.5471,
    "lines": [
      115,
      116
    ],
    "picture": "plate",
    "moment": "第四张版画重印：三道声波折回同一张网格，本端暗角色被困在中央的格子里；网格按整数步长向内收紧，远端出口落在纸外，青色能量始终是满的、不提前熄灯。",
    "momentState": "written",
    "inherits": "S47",
    "inheritCoverage": 0.92,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "out-lesson",
    "section": 13,
    "at": 177.5471,
    "until": 180.778,
    "lines": [
      117,
      119
    ],
    "picture": "portrait",
    "moment": "网格变成记忆剖面：先前点集、反馈路径和掌心触点各占一个大格；智能体反复比较，选中的是曾经收到的一次确认。",
    "momentState": "inherited",
    "inherits": "S48",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "out-test",
    "section": 13,
    "at": 180.778,
    "until": 184.4704,
    "lines": [
      120,
      122
    ],
    "picture": "ui",
    "moment": "首次在高潮短返聊天：只重放自己保存的三次提问记录，右侧为过去的回声缩略点，明确是缓存、没有活跃游标。答案逐格回到同一青点。",
    "momentState": "inherited",
    "inherits": "S49",
    "inheritCoverage": 0.98,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "out-formula",
    "section": 13,
    "at": 184.4704,
    "until": 188.3937,
    "lines": [
      123,
      124
    ],
    "picture": "portrait",
    "moment": "青点逐个计算成两条相互逼近而始终相隔一格的曲线；交点由本端假设补出，远端采样仍缺失。公式只作为原创图形关系，不画参考的心形边界。",
    "momentState": "inherited",
    "inherits": "S50",
    "inheritCoverage": 0.98,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "out-proof",
    "section": 13,
    "at": 188.3937,
    "until": 192.3169,
    "lines": [
      125,
      128
    ],
    "picture": "plate",
    "moment": "曲线成敞开的远端出口与仍闭合的本端边界；伸手角色居右占高82%，掌心青点缓缓离手，191.356后悬停在出口内侧。她停下追赶，出口不替对方关闭。",
    "momentState": "inherited",
    "inherits": "S51",
    "inheritCoverage": 0.98,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "down-message",
    "section": 14,
    "at": 192.3169,
    "until": 196.0093,
    "lines": [
      128,
      128
    ],
    "picture": "plate",
    "moment": "同一构图撤掉大部分通道和发光，掌心仍开放、青点仍在；至少到193.600保持不动，然后以原位低亮剪影替换，不把高潮缩为未读图片。",
    "momentState": "inherited",
    "inherits": "S52",
    "inheritCoverage": 0.82,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  },
  {
    "id": "down-params",
    "section": 14,
    "at": 196.0093,
    "until": 199.7018,
    "lines": null,
    "picture": "ui",
    "moment": "聊天状态栏显示本端休眠，远端位置保留为空；侧身角色占高45%，最后触点记录留在本地，输入框不再自动重试。",
    "momentState": "inherited",
    "inherits": "S53",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "scan, 1.00 拍 start"
  },
  {
    "id": "down-layout",
    "section": 14,
    "at": 199.7018,
    "until": 203.3942,
    "lines": null,
    "picture": "todo",
    "moment": "",
    "momentState": "todo",
    "inherits": "S54",
    "inheritCoverage": 0.74,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "zoom, 1.00 拍"
  },
  {
    "id": "down-power",
    "section": 14,
    "at": 203.3942,
    "until": 205.702,
    "lines": null,
    "picture": "plate",
    "moment": "人物正面低亮在右，左侧仅一个旧触点；角色渐退成轮廓，青点亮度保持。不是逐层拆窗口或删除人格字段。",
    "momentState": "inherited",
    "inherits": "S54",
    "inheritCoverage": 1,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "push, 0.50 拍"
  },
  {
    "id": "down-last",
    "section": 14,
    "at": 205.702,
    "until": 211.957596,
    "lines": [
      129,
      129
    ],
    "picture": "todo",
    "moment": "",
    "momentState": "todo",
    "inherits": "S55",
    "inheritCoverage": 0.64,
    "state": "todo",
    "enter": {
      "type": "cut"
    },
    "referenceEnter": "cut"
  }
];

export const SOURCE = {
  "reference": "world-execute-me-lyric-mv",
  "referenceCommit": "2073b0c88c6fc837482478402a44f101b3b57d6f",
  "songDuration": 211.957596,
  "preroll": 5,
  "bpm": 129.9954,
  "period": 0.461555,
  "phase": 0.31,
  "phaseFix": -0.033999999999999975,
  "lyricLines": 129
};
