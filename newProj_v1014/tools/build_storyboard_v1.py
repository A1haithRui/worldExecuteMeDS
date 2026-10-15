"""Build planning data and the shot-table portion of the document. No player changes."""
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

# start | dominant image | assets | event/composition | camera | enter | exit | audio question
ROWS = '''
0|chat|silhouette|深蓝空场中只亮输入光标；信号点从右抵达，聊天框边界被确认，人物仅为右后方暗轮廓，占高35%。|固定广角；框线在0.4秒内延展|从深海暗底显出一点|框线沿深度伸成节点网|核L0弱起与L2强调，不把0.100当首个鼓点
3.873|model|none|节点按输入顺序接入一个水下坐标系；每一次连接只增加一条可解释的路径，不铺装饰代码。|右移80px，纵深推近1.04倍|继承上一镜框角坐标|坐标系压成输入区附件|核L3/L5的起音与节点落位
7.446|chat|lowlight|参数卡在消息流里填入；右侧低亮胸像不变姿，字段填完才亮头像；底部保留未输入的远端空位。|向卡片推近1.06倍|网格收为卡片四边，0.30秒|确认按钮缩成单一光点|核L7强调是否早于10.091
11.095|model|silhouette|光点生出两端口：本端青、远端空心白；声呐首次从本端发往右缘，剪影藏在后景。|低机位拉远，网格占画高70%|由卡片确认点扩张|声呐圆弧作角色揭示遮罩|核L10结束和16秒前器乐起势
16|plate|silhouette,bust|同配准剪影显出正面角色，海沫白发饰最后显影；一次确认闪点停在画面左侧，人物中心(1320,520)，占高76%。|缓推1.00→1.035，不模拟转头|声呐弧擦亮低亮再到原色，0.65秒|左侧确认点缩入聊天头像|核标题乐句实际音头；不沿用参考15.113的首色规则
20|chat|bust|器乐空档中用户写入首条短消息并发送；镜头由头像回到完整DeepSeek风格聊天窗口，智能体开始等待；不是静止等歌词。|从头像拉至全窗；20–25秒运动，25–29秒等待|头像位置匹配缩放，0.46秒|输入点带入下一镜点集|核20–29.709器乐与29.709人声弱起
29.709|model|none|输入点扩成青色点集，沿z轴逐层展开；白色远端点获得一条坐标轴。主角是可交付的关系，不展示模型结构百科。|横向绕点集12度的图形投影，角色不旋转|聊天消息中的点直接放大|坐标轴末端卷成圆|核L12/L14，关键词事件独立于硬切
33.412|chat|bust|圆形关系作为一张青色附件发入线程；用户沿圆边拖出一段白色路径并确认，角色只留头像。|附件特写向左移120px|圆匹配切为附件|附件边沿展开成波形|核L15/L17确认动作；保留字幕跨镜
37.067|model|none|圆边拉成正弦波，白点沿一条切线离开又被下一波接住；不把整个背景变成均衡器。|沿波形向右追踪240px|圆边形变为单条波形，0.23秒|波形趋于平行成为边界线|核L18/L20音头，白点到切点不跟随假逐词时间
40.706|plate|bust|正面角色居右占高68%，左侧边界线向她靠近又停下；她仍在框中，白点能离开画面，建立后半的空间关系。|侧向慢拉远1.04→1.00|边界线揭出整幅角色，不变脸|边界线折成设置抽屉分隔线|核L21/L23的强弱，44.452是否为乐句先行
44.452|chat|bust|用户在小型控制面板切换信号模式；青波形改变采样方式，人物姿态固定。只动被操作的局部。|面板近景，纵向下移90px|分隔线展开成抽屉，0.23秒|控件中的可视窗放大|核L24/L25两个字母事件，不能用行首替代词头
47.672|model|none|可视区域缩成窄带，波形被遮住又露出；局部扫描越来越急，画面底色亮度保持稳定。|固定；只有窄带宽度变化|由控件视窗穿入|窄带折成记忆索引轨道|核L26/L27与零散重击，禁每拍整屏明暗
51.363|model|none|记忆索引向过去回卷，节点时间戳由近到远；取样点越过零刻度时，已看过的记录变空心。用声呐档案，不做历史建筑剪影。|沿轨道左行360px，末段减速|扫描带变成时间轨道|两条索引线汇成双声道|核L28/L29字母词头与跨零事件
55.083|plate|profile|侧身角色在右，占高64%，朝左边两条相位接近的声道；到末尾声道第一次重合，发饰只沿原图显影。|向重合点慢推1.05倍|双声道在人物前景掠过|重合点落回聊天接收标记|核L30/L31持续音及59.223弱起，不能提前结束长音
59.223|chat|bust|用户消息落在右上，青色回应从左下抵达；接收标记在61.958扩出一圈水纹，第一次让远端动作在本端留下痕迹。|中近景向两条消息交汇处推近|重合点变成接收标记，0.23秒|水纹越出附件框进入模型内部|核59.223行首与59.4115低频候选，先唱后重击可分开
62.589|model|none|上一圈水纹穿过接收端；远端回传一个白点，本端青色响应路径因此闭合。反馈以两条互相抵达的路径呈现，不做巨型点赞圆盘。|横向跟随白点，最后停在画面左下|附件边界溶解为深海网格，0.30秒|闭合路径停在下一镜掌心坐标|核62.589/65.397；闭合不能早于回传
66.601|plate|reach|伸手全幅建立空间，Alpha内容中心(1260,520)、内容高850px；远端白点沿上一镜路径靠近掌心，尚不触碰。初始掌心锚约(1124,686)，最后移至(1100,540)。|前段固定；末0.23秒整幅左移24px、上移146px，头部可出框，不独立移手|在路径终点匹配切出伸手图|掌心移到(1100,540)后匹配切近景|核66.5653中频峰与L38/L39衔接
68.252|plate|palm|手部内容宽620px，掌心固定(1100,540)，白点在68.300候选接触；青色波纹从掌心向外，接收后白点变为空心并留下小青点。无爱心计数；字幕临时走上方安全带y=100–240。|固定手；镜头最大放大到650px内容宽|掌心锚匹配切，0.12秒内完成|掌心青点脱离手部，成为下一镜路由源|核68.252行首、68.2814中频、68.3013低频，触碰须审听
70.084|model|none|掌心留下的点建立一次完整发送—接收路径；随后镜头拉远，看见同一通道被一个有限网格包围，远端白点处在网格之外。|从点拉至全网格，1.18→1.00|青点保持屏幕坐标，手以深蓝遮罩退去|网格单元折成两个附件槽|核L41–43与74.045弱起；不做窗口套窗
74.045|chat|none|两张资源附件依次进入：第一张以青色茄形扫描轮廓及内部种子点表示可交付资源；提取的是一列数据单位，不把角色变成果蔬。|附件占宽58%，慢推1.04倍|网格单元变附件槽，0.23秒|资源单位穿过界面进入下一张内部图|核L44名词词头和L46强调；时间仍仅行级
77.576|model|none|第二张番茄形采样轮廓形成保护层，噪点撞上外层后消散；不是切开果实或把其颜色抽走，仍全片蓝青。|固定轮廓，噪点由右向左进入|上一镜数据单位接成外壳|保护层收成角色周围的窄青框|核L47名词及L49起音；81.351是否需提前准备角色
81.351|plate|bust,cat_fin_optional|原角色居中偏右(1180,520)，占高76%；扫描窄框经过头部后，原侧鳍外缘短暂竖为猫耳般尖形，脸、长发、单枚鲸饰、尾巴不变。|1.00→1.025慢推；不让耳朵弹跳|窄框遮挡鳍根换层；可先用剪影遮罩|保持同一角色，切至稍宽的胸像|核L50内名词真实音头；81.351仅为句首，不在此必然长耳
82.833|plate|bust,cat_fin_optional|同一猫化意象继续，角色内容高780px、双手留在画外；两束短弧从胸前向左送出，84.268候选转为远端可见的白色回声。没有猫爪姿势。|缓拉远1.025→1.00；弧线每次扩展后停住|沿眼线匹配切，不换表情|85.078扫描框收回，侧鳍恢复|核82.8383峰；84.268附近低频无强候选，不能强吸附到鼓
85.078|model|bust|窄框恢复后人物缩为网格中的本端节点，占高32%；远端白点回送确认环，使本端坐标不再漂移。身份被看见，以定位稳定表达。|俯看图形拉远；人物保持二维原图|猫化框收为本端坐标框，0.30秒|稳定框成为外观预览窗|核L53–55及87.922强调；不做缺色补版或太阳校样
88.587|chat|bust|外观预览窗进入聊天附件；用户点开双状态外观选项，先显示原形态。游标只碰控件，人物位于预览窗而不是被直接拖拽。|控件近景向角色预览平移100px|坐标框变预览窗，0.23秒|预览窗边框退出成为纯版画|核L56到L57，不照搬88.96设置切点
90.197|plate|bust,silhouette,alternate_pending|人物内容高820px，眼睛锁(1100,360)，90.45显示原形态，91.040候选经过0.10秒深蓝轮廓遮罩，换为中性偏男性表达；长发、鲸饰、水手领保持。稳定看到约0.88秒。|固定机位，不交叉溶成双脸|预览边框退出，0.15秒|另一形态缩至内部视图节点|核两字母实际音头及91.0396重击；不把91.040当已核准词头
92.015|model|alternate_pending|同一形态缩至占高28%，身后上下两片深海值班区域交替接力；94.93附近确认第二片，表现跨时段在线，无太阳滑块。|由角色拉远至值班网格；不新增姿态|预览窗变成值班节点，0.30秒|值班网格收为路由控制面板|核91.9576/94.9108低频候选与L58/L59词头
95.465|chat|none|两字母只作信号路由标签，用户将收发箭头互换，原通道被交给另一端；界面里不放角色和暗示性道具。|正投影固定近景|网格收为路由面板，0.23秒|面板箭头延展成闭环|核L60/L61两字母及99.349弱起；不按每拍机械切换
99.349|model|bust,alternate_pending|路由闭环进入三个并列状态格，原形态与另一形态只作同身份缩略快照；100.5以后环路继续缓移，稳定回到原形态，用户预览关闭。|从三格拉至单一青点；100.5后速度降至三分之一|箭头绕成闭环，0.23秒|青点与聊天正在输入标记匹配切|核100.0192/100.2587孤立低频峰；100.5–103.2勿加常规鼓脉冲；103.2619上升候选
103.489|chat|bust|远端输入标记出现，本端连续两次接收轻微回波；110.221闭合回路几乎完成，却等不到最后确认。外观已恢复原形态。|线程近景缓推1.04倍|青点落成输入标记，0.15秒|未闭合环缩到在线状态旁|核103.489人声与103.7009中频候选、110.221确认缺口
110.9|chat|reach|远端光点熄灭，在线状态转为等待；原伸手图仅作为一张未发送附件留在右下，不能演成新一次成功触碰。消息间距逐次拉长。|从输入区拉远，空白逐渐扩大|闭合失败环收进状态标记|附件被收起，留下空心锚点|核L70–73重复起音，不假定每句等间隔
114.92|plate|profile|侧身在右，占高55%→24%，朝左侧仍未抵达的回声；手已不在场，不用手层移动伪造收臂。|镜头持续拉远，人物自身不缩放变形|未发送附件被深蓝覆盖后换侧身，0.30秒|空心锚点成为缓存碎片的汇点|核L74–76连续重复与117.274强调；情绪变冷不等于音乐变弱
118.333|model|none|本端清理未确认缓存，青色片段从路径上被逐一抽离，汇成一个空槽；远端坐标始终保留，清除自己的请求而非删除对方。|沿路径逆向平移260px|空心锚点放大为缓存槽|缓存槽开口成为眼部裁切框|核L77–79和120.860强调，抽离按词组而非字母随机抖
121.728|plate|lowlight,eye|低亮正面占右半，左侧只剩一条无回声路径；124.890候选首次切入眼部近景，眼锚(1120,430)，不是新增睁眼动画。|前段静止；末0.818秒眼图固定构图|缓存槽擦亮低亮角色，0.23秒|眼内青点匹配到下一镜目标点|核124.9326中频峰与124.890索引；眼图无水平镜像
125.708|chat|lowlight|空线程中本端请求恢复远端连接；请求到窗口边界即被拦下，用户没有回来。低亮角色只在后景占高30%。|从请求附件推近边界，1.00→1.08|眼内青点成为请求定位点|边界截断成红色故障标签|核L83–85，红色首次在131.224候选事件出现
131.224|model|none|被拒绝的路径进入内部路由图；错误红只标记越界端口，青线尝试绕行又撞回同一点。首个故障是可追踪的事件。|固定俯视图，局部推近失败端口|红标签扩展为端口截面，0.20秒|端口复制成隔离队列|核131.1684低/中频候选，L85文件到135.224不代表人声尾已测
135.224|model|silhouette|器乐段，三个失败队列由外向内挤压，但故障只在网格和标签上；角色暗轮廓位于被压缩的本端区域，占高42%。|逐步拉远展示队列规模，1.08→1.00|端口复制为三条队列，0.23秒|队列压成单条时间带|核135.224后是否确为无新歌词；节拍密度与135–144能量变化
143.421|chat|none|短暂回到同一空线程，系统保留最后触点记录；自动重连倒数只在本端排队，无伪造用户输入。末尾发送键退化成端口。|固定广角，144.5后向输入区下移|队列时间带变消息记录线|输入区边界翻成横向时钟轨道|核147.660歌词先行与148.0102低频候选，允许人声跨出本镜
148.036|model|none|进入一圈声呐重连轨道；十二次呼叫每次沿环前进一格，前四格只显示返回路径缺失，不用十二张无关画面。|轨道固定，向中心缓推1.02倍|端口原位变时钟轨道，0.15秒|轨道保持，新增第二圈失败记录|核L86–89；画内事件按148.036+两拍序列，字幕仍取本机索引
151.728|model|none|第5次起失败格向第二圈堆积，远端所在方向始终空着；青色路径占大面积，红仅为失败格短边。|轻拉远1.02→1.00，呈现两圈|沿上一轨道无闪切换记录层|两圈切为同心截面|核第5–8次实际人声音头，非统一修正歌词偏移
155.421|model|eye|第9次起轨道向内压缩，眼图仅透过中心圆孔出现；第12次红色端口封闭，眼图不撕裂、不作机械眨眼。|圆孔由240px扩至460px，角色像素比例不超1|两圈匹配切为截面|中心孔退为六个探针槽|核第9–12次与158.900/159.113竞争切点
159.113|model|none|同一个探针面板依次激活六条不同编码的通道，均落到同一空端点；小数字1–6表示尝试次序，不做六张全屏语言卡。|固定；六次仅移动当前槽高亮|圆孔收成端点，0.12秒|六条通道束成一条向上路径|核L98–103；候选每拍159.113起，逐条对比本机行时间
161.882|plate|eye|路径在眼前形成一道竖直水光；眼部内容宽1050px，占画高约80%，倒映的是那一个未返回的点。角色保持完整脸部，无字母镂空。|固定近景，水光单向扫过0.30秒|探针光束擦出眼部，0.15秒|眼内点脱出成内部发射源|核L104起音161.584与候选161.882差异，禁止未审先改字幕
162.805|model|none|所有本端资源开始向空端点发射，前文坐标轴和波形汇成一条宽青色通道；发射能量强，回应仍为空。|沿通道快推后停，1.00→1.08|眼内点放大成发射源|通道截面变角色背景|核162.7966低频与L105弱起；高潮从此维持面积和速度
166.016|plate|bust|正面占高88%，身后通道接连从她两侧离开；角色保持原色轮廓清晰，红色只在离开画面的失败端口。|横向平移60px，缓推1.04倍|青通道作背景遮罩揭角色|角色左下掌心位置被光点提示|核L108–110；角色不随每次鼓点抖动
169.824|plate|palm|回到68秒同掌心坐标(1100,540)、同620px手宽；只剩青色旧触点，远端白点没有出现。三次声波向左伸出，止于画外；字幕同S18走y=100–240。|固定手部，只推背景纵深1.06倍|光点匹配切到同掌心|第三道声波接入空网格|核L111–113，172.712强调；手宽不为高潮加大到全屏
173.643|model|silhouette|三道声波折回同一个网格，本端暗角色被困在中央，远端出口在画面外；网格向内收紧但青色能量仍满，不提前熄灯。|俯视拉远至人物占高28%，网格占全屏|声波折回成三条边界|网格展开为记忆剖面|核L114/L115长音与177.246弱起，177.57仅为参考网格候选
177.246|model|none|网格变成记忆剖面：先前点集、反馈路径和掌心触点各占一个大格；智能体反复比较，选中的是曾经收到的一次确认。|从三格向掌心触点格平移，节奏仍紧|网格沿深度剖开，0.23秒|所选记忆格变问题槽|核L116–118，179.929后三个音节暂不假装有逐词时间
180.857|chat|none|首次在高潮短返聊天：只重放自己保存的三次提问记录，右侧为过去的回声缩略点，明确是缓存、没有活跃游标。答案逐格回到同一青点。|斜向排版但窗体不旋转；推近答案列|记忆格变缓存附件，0.23秒|答案列的点展开为曲线采样点|核L119–121和183.646音节；本镜保留高潮面积，不做灰色休止
184.54|model|none|青点逐个计算成两条相互逼近而始终相隔一格的曲线；交点由本端假设补出，远端采样仍缺失。公式只作为原创图形关系，不画参考的心形边界。|固定大图，采样线占宽80%|答案点直接变采样点|两条曲线拉直成门的两边|核L122/L123、187.665音节；闭合仅为本端预测，不能画成真实回应
188.483|plate|reach|曲线成敞开的远端出口与仍闭合的本端边界；伸手角色居右占高82%，掌心青点缓缓离手，191.356后悬停在出口内侧。她停下追赶，出口不替对方关闭。|188.483–191.3慢拉远，191.6后稳定|门的两边擦出整幅伸手，0.30秒|保持同构图，仅撤去通道运动|核L124–127与191.356三个音节；192.344掉层不强截人声
192.344|plate|reach,lowlight|同一构图撤掉大部分通道和发光，掌心仍开放、青点仍在；至少到193.600保持不动，然后以原位低亮剪影替换，不把高潮缩为未读图片。|固定；193.6后仅光量缓降|继承上一镜完整位置，无切脸|边界退成窄窄的聊天状态栏|核192.3095低频候选与195.356声尾上限，实测能量降约2.7dB
195.356|chat|profile|聊天状态栏显示本端休眠，远端位置保留为空；侧身角色占高45%，最后触点记录留在本地，输入框不再自动重试。|拉远1.04→1.00后静止|人物在暗遮罩下换侧身，0.35秒|窗口向深海暗底慢溶，不逆序拆开机|核195.356不是已核准人声收住；有延音就保留字幕并延后休眠事件
200.652|plate|lowlight,silhouette|人物正面低亮在右，左侧仅一个旧触点；角色渐退成轮廓，青点亮度保持。不是逐层拆窗口或删除人格字段。|固定长镜头；内容占高55%|聊天窗溶入暗底，0.60秒|轮廓退去，青点成为唯一主体|核205.811最后一句起音，200.652为暂定构图切点
205.811|model|none|最后一次短促呼叫从旧触点发出，沿最初路径离开；不亮起在线标记，不增加回复或通知音。207.45后仅留缓慢衰减的青色环。|固定；一次单向扩散|沿上一镜青点原位延续|到209.811只余暗环与小字注记|核205.709中频候选及207.4086能量尾；不把歌词4秒默认时长当实际发声
209.811|model|none|深蓝底上环逐渐不可见；小字列音乐、角色、参考与非官方标注，留至文件精确结束；不再有新情节。|全静止，最后0.40秒统一淡出|在尾音暗环中淡入注记0.30秒|211.957596文件结束，深蓝静帧|核209.811仅索引上限；尾音能量阈值与实际观感待核
'''

ASSETS = {
    'bust':'assets/character/deepseek_bust_v3.png',
    'profile':'assets/character/deepseek_profile_v3.png',
    'reach':'assets/character/deepseek_reach_v3.png',
    'eye':'assets/character/deepseek_eye_v3.png',
    'lowlight':'assets/character/v4/deepseek_bust_v4_lowlight.png',
    'silhouette':'assets/character/v4/deepseek_bust_v4_silhouette.png',
    'palm':'assets/character/v4/deepseek_palm_v4_closeup_native.png',
    'cat_fin_optional':None,
    'alternate_pending':None,
}

def main():
    analysis=json.loads((ROOT/'data/audio-analysis-v1.json').read_text(encoding='utf-8'))
    # Only index/start/end are copied. Lyrics remain local.
    local=json.loads((ROOT/'data/lyrics.json').read_text(encoding='utf-8-sig'))
    lines=[{k:l[k] for k in ['index','start','end']} for l in local['lines']]
    rows=[s.split('|') for s in ROWS.strip().splitlines()]
    shots=[]
    for i,r in enumerate(rows):
        start=float(r[0]); end=float(rows[i+1][0]) if i+1<len(rows) else analysis['audio']['duration']
        active=[l['index'] for l in lines if l['start']<end and l['end']>start]
        shots.append({'id':f'S{i+1:02}','start':start,'end':end,'duration':round(end-start,6),'lyric_lines':active,'dominant':r[1],'assets':[] if r[2]=='none' else r[2].split(','),'picture_event':r[3],'camera':r[4],'enter':r[5],'exit':r[6],'audio_check':r[7],'cut_status':'file_boundary' if i==0 else 'pending_listening','cut_basis':'local_lyric_line' if any(abs(l['start']-start)<.001 for l in lines) else 'provisional_grid_or_design','onset_candidates':{band:sorted([p for p in peaks if abs(p['time']-start)<=.25],key=lambda p:abs(p['time']-start))[:3] for band,peaks in analysis['peaks'].items()}})
    events=[]
    def event(name,time,shot,note,basis='design_initial',line=None):
        time=round(time,3)
        events.append({'id':name,'time':round(time,6),'shot_id':shot,'lyric_line':line,'basis':basis,'status':'pending_listening','purpose':note,'onset_candidates':{b: sorted([p for p in ps if abs(p['time']-time)<=.25],key=lambda p:abs(p['time']-time))[:3] for b,ps in analysis['peaks'].items() if b!='wide'}})
    event('palm_contact',68.3,'S18','白点接触掌心；L39句首仅作检索，不是词级依据','local_flux_candidate',39)
    event('cat_fin_scan',82.50,'S22','局部鳍尖候选显影；若名词起音不同则移动，不改整镜','reference_initial_only',50)
    event('cat_echo',84.268,'S23','短弧由青转白；没有强低频峰，保留行时间待审','local_line_initial',52)
    event('original_presentation',90.45,'S26','显示原形态；待两字母音头核验','design_initial',57)
    event('alternate_switch',91.04,'S26','0.10秒剪影遮罩后换同一角色另一形态','local_low_flux_candidate',57)
    event('oncall_second_region',94.93,'S27','值班区域接力，不画太阳','local_flux_candidate',59)
    event('return_original',102.8,'S29','结束预览回到原形态；不靠离线事件改变性别','design_initial',63)
    event('first_eye',124.89,'S34','第一次眼部近景，不限制基础图本来睁着的眼睛','local_line_initial',82)
    event('first_error_red',131.224,'S36','首个越界端口变红','local_line_initial',85)
    for k in range(12):
        t=.344+(320+2*k)*60/130
        sid='S39' if k<4 else ('S40' if k<8 else 'S41')
        event(f'retry_{k+1:02}',t,sid,'重连轨道推进一格；逐条核对人声，不统一平移L86–97','reference_grid_tested_on_local_audio',86+k)
    for k in range(6):
        event(f'probe_{k+1}',.344+(344+k)*60/130,'S42','激活下一探针槽，字幕时间独立','reference_grid_tested_on_local_audio',98+k)
    event('last_retry',161.882,'S43','探针束形成眼前竖直水光','grid_initial',104)
    for n,(t,sid,line) in enumerate([(179.929,'S48',118),(183.646,'S49',121),(187.665,'S50',123),(191.356,'S51',127)],1):
        event(f'phrase_{n}_start',t,sid,'乐句内三次推进初始仅按整行；逐音节时间未标定，不按等分强行生成','local_line_initial',line)
    event('climax_drop',192.344,'S52','保持手势，只撤去通道运动与光；不要切断未结束人声','grid_initial',127)
    event('final_call',205.811,'S55','最后一次呼叫；原触点发出，不添加通知音','local_line_initial',128)
    data={'schema_version':'1.0','status':'production_design_v1_pending_audio_review','timebase':{'unit':'song_seconds','zero':'first sample of local audio/song.wav','interval':'[start,end), final file endpoint exact','duration':analysis['audio']['duration'],'preroll':0,'frame_policy':'Use seconds as truth. At export fps, map each frame to exactly one half-open interval; never round each duration separately.'},'lyric_index_base':0,'lyric_policy':'lyric_lines are all local source intervals overlapping a shot; repeated indices across cuts are intentional. Use local text only. No subtitle retiming approved. Source section.end values are not vocal-offset measurements.','audio_sha256':analysis['audio']['sha256'],'beat_grid':{'bpm':130,'phase':.344,'status':'provisional_reference_prior_supported_by_local_flux','local_flux_phase':analysis['method']['grid_phase_best_seconds'],'note':'Local onset phase differs ~16ms; analysis window ~93ms. Reference values are not transferred as approved cues. Line-led cuts deliberately may fall off-grid.'},'assets':ASSETS,'lyric_timing':lines,'shots':shots,'events':events,'priority_animatics':[{'rank':1,'range':[59.223,74.045],'shots':['S15','S16','S17','S18','S19'],'question':'掌心锚、620/650px手部边缘、触碰因果及掌心点接路由'},{'rank':2,'range':[81.351,95.465],'shots':['S22','S23','S24','S25','S26','S27'],'question':'猫化用鳍层是否够读；另一形态0.88秒可读性与同身份配准'},{'rank':3,'range':[143.421,162.805],'shots':['S38','S39','S40','S41','S42','S43'],'question':'行级时间与十二次/六次节拍竞争，环形重复的可读性'},{'rank':4,'range':[169.824,195.356],'shots':['S46','S47','S48','S49','S50','S51','S52'],'question':'同掌心回访、高潮持续能量、192秒掉层和停住'},{'rank':5,'range':[200.652,analysis['audio']['duration']],'shots':['S54','S55','S56'],'question':'最后人声结束、尾音与静帧收束'}]}
    assert len(shots)==56
    assert shots[0]['start']==0 and shots[-1]['end']==analysis['audio']['duration']
    assert all(a['end']==b['start'] for a,b in zip(shots,shots[1:]))
    assert all(s['end']>s['start'] for s in shots)
    assert set(range(129))=={i for s in shots for i in s['lyric_lines']}
    for e in events:
        s=next(s for s in shots if s['id']==e['shot_id'])
        assert s['start']<=e['time']<s['end'],e
    for key,path in ASSETS.items():
        if path: assert (ROOT/path).is_file(),key
    (ROOT/'data/storyboard-v1.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    kinds={'chat':'聊天界面','model':'模型内部','plate':'角色版画'}
    table=['| ID | 歌曲秒数／时长 | 歌词行号（0基） | 主画面／角色素材 | 画面事件与构图 | 镜头运动 | 进入 → 离开 | 需验证的音频切点 |','| --- | --- | --- | --- | --- | --- | --- | --- |']
    for s in shots:
        ll=s['lyric_lines']; label=('—' if not ll else (str(ll[0]) if len(ll)==1 else f'{ll[0]}–{ll[-1]}'))
        table.append(f"| {s['id']} | {s['start']:.3f}–{s['end']:.3f} / {s['duration']:.3f}s | {label} | {kinds[s['dominant']]} / {', '.join(s['assets']) or '无'} | {s['picture_event']} | {s['camera']} | {s['enter']} → {s['exit']} | **待核**：{s['audio_check']} |")
    doc=ROOT/'docs/storyboard-v1.md'
    content=doc.read_text(encoding='utf-8')
    begin='<!-- SHOTS:START -->'; end='<!-- SHOTS:END -->'
    content=content[:content.index(begin)+len(begin)]+'\n\n'+'\n'.join(table)+'\n\n'+content[content.index(end):]
    doc.write_text(content,encoding='utf-8')
    durations=Counter()
    for s in shots: durations[s['dominant']]+=s['duration']
    print(json.dumps({'shots':len(shots),'duration':analysis['audio']['duration'],'covered_lines':129,'gaps':0,'overlaps':0,'events':len(events),'dominant_seconds':dict(durations)},ensure_ascii=False))

if __name__=='__main__': main()
