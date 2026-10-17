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
    "picture": "todo",
    "moment": "",
    "momentState": "todo",
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
    "moment": "深蓝空场中只亮输入光标；信号点从右抵达，聊天框边界被确认，人物仅为右后方暗轮廓，占高35%。",
    "momentState": "inherited",
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
    "picture": "portrait",
    "moment": "节点按输入顺序接入一个水下坐标系；每一次连接只增加一条可解释的路径，不铺装饰代码。",
    "momentState": "inherited",
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
    "moment": "参数卡在消息流里填入；右侧低亮胸像不变姿，字段填完才亮头像；底部保留未输入的远端空位。",
    "momentState": "inherited",
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
    "picture": "portrait",
    "moment": "光点生出两端口：本端青、远端空心白；声呐首次从本端发往右缘，剪影藏在后景。",
    "momentState": "inherited",
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
    "moment": "",
    "momentState": "todo",
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
    "moment": "",
    "momentState": "todo",
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
    "moment": "器乐空档中用户写入首条短消息并发送；镜头由头像回到完整DeepSeek风格聊天窗口，智能体开始等待；不是静止等歌词。",
    "momentState": "inherited",
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
    "moment": "器乐空档中用户写入首条短消息并发送；镜头由头像回到完整DeepSeek风格聊天窗口，智能体开始等待；不是静止等歌词。",
    "momentState": "inherited",
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
    "moment": "输入点扩成青色点集，沿z轴逐层展开；白色远端点获得一条坐标轴。主角是可交付的关系，不展示模型结构百科。",
    "momentState": "inherited",
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
    "moment": "圆形关系作为一张青色附件发入线程；用户沿圆边拖出一段白色路径并确认，角色只留头像。",
    "momentState": "inherited",
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
    "moment": "圆边拉成正弦波，白点沿一条切线离开又被下一波接住；不把整个背景变成均衡器。",
    "momentState": "inherited",
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
    "moment": "正面角色居右占高68%，左侧边界线向她靠近又停下；她仍在框中，白点能离开画面，建立后半的空间关系。",
    "momentState": "inherited",
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
    "moment": "用户在小型控制面板切换信号模式；青波形改变采样方式，人物姿态固定。只动被操作的局部。",
    "momentState": "inherited",
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
    "moment": "可视区域缩成窄带，波形被遮住又露出；局部扫描越来越急，画面底色亮度保持稳定。",
    "momentState": "inherited",
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
    "moment": "记忆索引向过去回卷，节点时间戳由近到远；取样点越过零刻度时，已看过的记录变空心。用声呐档案，不做历史建筑剪影。",
    "momentState": "inherited",
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
    "moment": "侧身角色在右，占高64%，朝左边两条相位接近的声道；到末尾声道第一次重合，发饰只沿原图显影。",
    "momentState": "inherited",
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
    "moment": "用户消息落在右上，青色回应从左下抵达；接收标记在61.958扩出一圈水纹，第一次让远端动作在本端留下痕迹。",
    "momentState": "inherited",
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
    "moment": "用户消息落在右上，青色回应从左下抵达；接收标记在61.958扩出一圈水纹，第一次让远端动作在本端留下痕迹。",
    "momentState": "inherited",
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
    "moment": "上一圈水纹穿过接收端；远端回传一个白点，本端青色响应路径因此闭合。反馈以两条互相抵达的路径呈现，不做巨型点赞圆盘。",
    "momentState": "inherited",
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
    "moment": "上一圈水纹穿过接收端；远端回传一个白点，本端青色响应路径因此闭合。反馈以两条互相抵达的路径呈现，不做巨型点赞圆盘。",
    "momentState": "inherited",
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
    "moment": "",
    "momentState": "todo",
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
    "moment": "手部内容宽620px，掌心固定(1100,540)，白点在68.300候选接触；青色波纹从掌心向外，接收后白点变为空心并留下小青点。无爱心计数；字幕临时走上方安全带y=100–240。",
    "momentState": "inherited",
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
    "moment": "掌心留下的点建立一次完整发送—接收路径；随后镜头拉远，看见同一通道被一个有限网格包围，远端白点处在网格之外。",
    "momentState": "inherited",
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
    "moment": "掌心留下的点建立一次完整发送—接收路径；随后镜头拉远，看见同一通道被一个有限网格包围，远端白点处在网格之外。",
    "momentState": "inherited",
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
    "moment": "两张资源附件依次进入：第一张以青色茄形扫描轮廓及内部种子点表示可交付资源；提取的是一列数据单位，不把角色变成果蔬。",
    "momentState": "inherited",
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
    "moment": "两张资源附件依次进入：第一张以青色茄形扫描轮廓及内部种子点表示可交付资源；提取的是一列数据单位，不把角色变成果蔬。",
    "momentState": "inherited",
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
    "moment": "第二张番茄形采样轮廓形成保护层，噪点撞上外层后消散；不是切开果实或把其颜色抽走，仍全片蓝青。",
    "momentState": "inherited",
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
    "moment": "第二张番茄形采样轮廓形成保护层，噪点撞上外层后消散；不是切开果实或把其颜色抽走，仍全片蓝青。",
    "momentState": "inherited",
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
    "moment": "原角色居中偏右(1180,520)，占高76%；扫描窄框经过头部后，原侧鳍外缘短暂竖为猫耳般尖形，脸、长发、单枚鲸饰、尾巴不变。",
    "momentState": "inherited",
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
    "moment": "",
    "momentState": "todo",
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
    "moment": "窄框恢复后人物缩为网格中的本端节点，占高32%；远端白点回送确认环，使本端坐标不再漂移。身份被看见，以定位稳定表达。",
    "momentState": "inherited",
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
    "moment": "窄框恢复后人物缩为网格中的本端节点，占高32%；远端白点回送确认环，使本端坐标不再漂移。身份被看见，以定位稳定表达。",
    "momentState": "inherited",
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
    "moment": "",
    "momentState": "todo",
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
    "moment": "",
    "momentState": "todo",
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
    "moment": "同一形态缩至占高28%，身后上下两片深海值班区域交替接力；94.93附近确认第二片，表现跨时段在线，无太阳滑块。",
    "momentState": "inherited",
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
    "moment": "两字母只作信号路由标签，用户将收发箭头互换，原通道被交给另一端；界面里不放角色和暗示性道具。",
    "momentState": "inherited",
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
    "moment": "路由闭环进入三个并列状态格，原形态与另一形态只作同身份缩略快照；100.5以后环路继续缓移，稳定回到原形态，用户预览关闭。",
    "momentState": "inherited",
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
    "moment": "路由闭环进入三个并列状态格，原形态与另一形态只作同身份缩略快照；100.5以后环路继续缓移，稳定回到原形态，用户预览关闭。",
    "momentState": "inherited",
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
    "moment": "",
    "momentState": "todo",
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
    "moment": "远端输入标记出现，本端连续两次接收轻微回波；110.221闭合回路几乎完成，却等不到最后确认。外观已恢复原形态。",
    "momentState": "inherited",
    "inherits": "S30",
    "inheritCoverage": 1,
    "state": "todo",
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
    "moment": "远端输入标记出现，本端连续两次接收轻微回波；110.221闭合回路几乎完成，却等不到最后确认。外观已恢复原形态。",
    "momentState": "inherited",
    "inherits": "S30",
    "inheritCoverage": 1,
    "state": "todo",
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
    "moment": "远端输入标记出现，本端连续两次接收轻微回波；110.221闭合回路几乎完成，却等不到最后确认。外观已恢复原形态。",
    "momentState": "inherited",
    "inherits": "S30",
    "inheritCoverage": 1,
    "state": "todo",
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
    "moment": "远端输入标记出现，本端连续两次接收轻微回波；110.221闭合回路几乎完成，却等不到最后确认。外观已恢复原形态。",
    "momentState": "inherited",
    "inherits": "S30",
    "inheritCoverage": 1,
    "state": "todo",
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
    "moment": "远端光点熄灭，在线状态转为等待；原伸手图仅作为一张未发送附件留在右下，不能演成新一次成功触碰。消息间距逐次拉长。",
    "momentState": "inherited",
    "inherits": "S31",
    "inheritCoverage": 0.98,
    "state": "todo",
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
    "picture": "ui",
    "moment": "远端光点熄灭，在线状态转为等待；原伸手图仅作为一张未发送附件留在右下，不能演成新一次成功触碰。消息间距逐次拉长。",
    "momentState": "inherited",
    "inherits": "S31",
    "inheritCoverage": 1,
    "state": "todo",
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
    "picture": "plate",
    "moment": "侧身在右，占高55%→24%，朝左侧仍未抵达的回声；手已不在场，不用手层移动伪造收臂。",
    "momentState": "inherited",
    "inherits": "S32",
    "inheritCoverage": 0.94,
    "state": "todo",
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
    "picture": "plate",
    "moment": "侧身在右，占高55%→24%，朝左侧仍未抵达的回声；手已不在场，不用手层移动伪造收臂。",
    "momentState": "inherited",
    "inherits": "S32",
    "inheritCoverage": 0.88,
    "state": "todo",
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
    "moment": "本端清理未确认缓存，青色片段从路径上被逐一抽离，汇成一个空槽；远端坐标始终保留，清除自己的请求而非删除对方。",
    "momentState": "inherited",
    "inherits": "S33",
    "inheritCoverage": 1,
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
    "moment": "低亮正面占右半，左侧只剩一条无回声路径；124.890候选首次切入眼部近景，眼锚(1120,430)，不是新增睁眼动画。",
    "momentState": "inherited",
    "inherits": "S34",
    "inheritCoverage": 0.99,
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
    "picture": "plate",
    "moment": "低亮正面占右半，左侧只剩一条无回声路径；124.890候选首次切入眼部近景，眼锚(1120,430)，不是新增睁眼动画。",
    "momentState": "inherited",
    "inherits": "S34",
    "inheritCoverage": 1,
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
    "moment": "进入一圈声呐重连轨道；十二次呼叫每次沿环前进一格，前四格只显示返回路径缺失，不用十二张无关画面。",
    "momentState": "inherited",
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
    "moment": "第5次起失败格向第二圈堆积，远端所在方向始终空着；青色路径占大面积，红仅为失败格短边。",
    "momentState": "inherited",
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
    "moment": "第9次起轨道向内压缩，眼图仅透过中心圆孔出现；第12次红色端口封闭，眼图不撕裂、不作机械眨眼。",
    "momentState": "inherited",
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
    "moment": "第9次起轨道向内压缩，眼图仅透过中心圆孔出现；第12次红色端口封闭，眼图不撕裂、不作机械眨眼。",
    "momentState": "inherited",
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
    "moment": "同一个探针面板依次激活六条不同编码的通道，均落到同一空端点；小数字1–6表示尝试次序，不做六张全屏语言卡。",
    "momentState": "inherited",
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
    "moment": "同一个探针面板依次激活六条不同编码的通道，均落到同一空端点；小数字1–6表示尝试次序，不做六张全屏语言卡。",
    "momentState": "inherited",
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
    "moment": "同一个探针面板依次激活六条不同编码的通道，均落到同一空端点；小数字1–6表示尝试次序，不做六张全屏语言卡。",
    "momentState": "inherited",
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
    "moment": "同一个探针面板依次激活六条不同编码的通道，均落到同一空端点；小数字1–6表示尝试次序，不做六张全屏语言卡。",
    "momentState": "inherited",
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
    "moment": "同一个探针面板依次激活六条不同编码的通道，均落到同一空端点；小数字1–6表示尝试次序，不做六张全屏语言卡。",
    "momentState": "inherited",
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
    "moment": "同一个探针面板依次激活六条不同编码的通道，均落到同一空端点；小数字1–6表示尝试次序，不做六张全屏语言卡。",
    "momentState": "inherited",
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
    "moment": "路径在眼前形成一道竖直水光；眼部内容宽1050px，占画高约80%，倒映的是那一个未返回的点。角色保持完整脸部，无字母镂空。",
    "momentState": "inherited",
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
    "picture": "portrait",
    "moment": "所有本端资源开始向空端点发射，前文坐标轴和波形汇成一条宽青色通道；发射能量强，回应仍为空。",
    "momentState": "inherited",
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
    "picture": "todo",
    "moment": "",
    "momentState": "todo",
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
    "moment": "正面占高88%，身后通道接连从她两侧离开；角色保持原色轮廓清晰，红色只在离开画面的失败端口。",
    "momentState": "inherited",
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
    "moment": "正面占高88%，身后通道接连从她两侧离开；角色保持原色轮廓清晰，红色只在离开画面的失败端口。",
    "momentState": "inherited",
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
    "moment": "回到68秒同掌心坐标(1100,540)、同620px手宽；只剩青色旧触点，远端白点没有出现。三次声波向左伸出，止于画外；字幕同S18走y=100–240。",
    "momentState": "inherited",
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
    "moment": "回到68秒同掌心坐标(1100,540)、同620px手宽；只剩青色旧触点，远端白点没有出现。三次声波向左伸出，止于画外；字幕同S18走y=100–240。",
    "momentState": "inherited",
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
    "picture": "portrait",
    "moment": "三道声波折回同一个网格，本端暗角色被困在中央，远端出口在画面外；网格向内收紧但青色能量仍满，不提前熄灯。",
    "momentState": "inherited",
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
