// 红楼梦 · 万物博物馆 —— 知识库数据
// 数据基于《红楼梦》公开通识与人民文学出版社通行本整理，用于展厅展示。
// 每条 exhibit 即一个“展厅”，links 即通往其它展厅的“门”（互链成图）。

export const CATEGORIES = {
  "人物":   { color: "#7a4b3a", glyph: "人" },
  "诗词判词": { color: "#3a5a7a", glyph: "诗" },
  "章回":   { color: "#4a6b3a", glyph: "回" },
  "地点":   { color: "#7a6a3a", glyph: "景" },
};

export const EXHIBITS = [
  // ===================== 人物 =====================
  {
    id: "baoyu", title: "贾宝玉", category: "人物",
    summary: "荣国府嫡派子孙，衔玉而生，全书核心人物。",
    body: "贾政与王夫人之子，出生时口含一块通灵宝玉，故得名。他厌恶仕途经济，钟情于女儿们纯净的世界，与林黛玉为知己，最终却与薛宝钗成婚。历经家族盛衰、黛玉泪尽而亡后，于雪地拜别贾政，悬崖撒手出家为僧。",
    links: ["daiyu","baochai","jiamu","jiazheng","xifeng","xiren","qingwen","yihongyuan","taihu","baoyu_chujia"]
  },
  {
    id: "daiyu", title: "林黛玉", category: "人物",
    summary: "贾母外孙女，绛珠仙草转世，宝玉的知己与所爱。",
    body: "林如海与贾敏之女，母亡后投奔贾府，居于潇湘馆。她才情绝代、敏感多愁，前世为绛珠仙草，以一生眼泪还报神瑛侍者（宝玉）的甘露之惠。最终在宝玉与宝钗成婚之夜焚稿断痴情，含恨而逝。",
    links: ["baoyu","baochai","xiangyun","zijuan","xiaoxiangguan","zanghua","daiyu_zanghua","daiyu_fengao","daiyu_jinfu"]
  },
  {
    id: "baochai", title: "薛宝钗", category: "人物",
    summary: "薛姨妈之女，端庄稳重，金锁与宝玉之玉称“金玉良缘”。",
    body: "皇商薛家之女，容貌丰美、举止娴雅，恪守封建礼教。她佩戴錾有“不离不弃，芳龄永继”的金锁，与宝玉的通灵玉合称“金玉良缘”。在家族安排下与宝玉成婚，却终难求得宝玉之心，后宝玉出家，独守空闺。",
    links: ["baoyu","daiyu","xuepan","wangfuren","hengwuyuan","baihaitang","daiyu_fengao"]
  },
  {
    id: "xifeng", title: "王熙凤", category: "人物",
    summary: "贾琏之妻，荣国府实际当家人，精明泼辣。",
    body: "王夫人的内侄女，人称“凤辣子”。她掌管荣国府家务，机变百出、手腕狠辣，既揽权聚财又乐于助人。弄权铁槛寺、毒设相思局，最终“机关算尽太聪明，反算了卿卿性命”，落得悲惨下场。",
    links: ["jiamu","jialian","pingr","jiazheng","wangfuren","chaojian","baoyu_ada","qiaojie"]
  },
  {
    id: "jiamu", title: "贾母", category: "人物",
    summary: "荣国府最高长辈，史太君，宝玉的祖母。",
    body: "贾代善之妻，出身史侯家，人称史太君。她是贾府辈分最高、最受尊崇的老祖宗，极疼爱宝玉与黛玉。贾府的繁华与衰败她都看在眼里，临终前家已破败，是贾府盛衰的见证者。",
    links: ["baoyu","daiyu","jiazheng","xifeng","rongguofu","yuanyang","liaolao"]
  },
  {
    id: "jiazheng", title: "贾政", category: "人物",
    summary: "宝玉之父，端方正直的封建家长代表。",
    body: "贾母次子，工部员外郎，恪守儒家正统，望子成龙。因宝玉厌恶读书、结交优伶，盛怒下将其毒打（宝玉挨打）。他是封建礼教的维护者，却眼见家族与儿子双双背离其理想。",
    links: ["baoyu","wangfuren","jiamu","baoyu_ada","rongguofu"]
  },
  {
    id: "wangfuren", title: "王夫人", category: "人物",
    summary: "宝玉生母，贾政正妻，表面吃斋念佛。",
    body: "京营节度使王子腾之妹，育有元春、宝玉。她外表宽厚信佛，实则维护封建秩序，撵逐晴雯、金钏投井等事件皆出其手，是“慈眉”下的冷酷力量。",
    links: ["baoyu","jiazheng","xifeng","baochai","jiamu"]
  },
  {
    id: "xiangyun", title: "史湘云", category: "人物",
    summary: "贾母侄孙女，豪爽率真，醉卧芍药裀。",
    body: "保龄侯史家之女，自幼父母双亡，由叔婶抚养。她英豪阔大、心直口快，曾于大观园醉眠石凳、落英满身。后嫁卫若兰，夫亡后流落，是金陵十二钗之一。",
    links: ["baoyu","daiyu","baochai","daguanyuan","liuxu"]
  },
  {
    id: "miaoyu", title: "妙玉", category: "人物",
    summary: "栊翠庵带发修行的尼姑，孤高自许。",
    body: "出身仕宦，因病出家，住栊翠庵。她“欲洁何曾洁，云空未必空”，性情孤傲，对宝玉暗含情愫。贾府败后遭劫，结局“可怜金玉质，终陷淖泥中”。",
    links: ["baoyu","longcuan","daiyu","xichun"]
  },
  {
    id: "yanchun", title: "贾元春", category: "人物",
    summary: "宝玉长姐，贤德妃，金陵十二钗之一。",
    body: "贾政长女，选入宫中加封贤德妃，省亲时建大观园。她是贾府荣耀的顶点，判词“二十年来辨是非，榴花开处照宫闱”。暴病而亡后，贾府失其倚仗，渐趋衰败。",
    links: ["baoyu","jiamu","yuanchun_xingqin","rongguofu","jinling"]
  },
  {
    id: "tanchun", title: "贾探春", category: "人物",
    summary: "赵姨娘所生，精明果决，曾理家兴利。",
    body: "贾政与赵姨娘之女，三姑娘，机敏能干、志气清高。王熙凤病中代掌家务，推行“承包制”兴利除弊；抄检大观园时掌掴王善保家的，刚烈不让。后远嫁海外，是十二钗中结局较好者。",
    links: ["baoyu","jiamu","xifeng","chaojian","daguanyuan","liwan","liuxu"]
  },
  {
    id: "yingchun", title: "贾迎春", category: "人物",
    summary: "贾赦之女，懦弱怕事，误嫁中山狼。",
    body: "贾赦之女，二姑娘，性情懦弱、人称“二木头”。误嫁骄横残暴的孙绍祖，受虐一年便“一载赴黄粱”，是封建包办婚姻的牺牲品。",
    links: ["baoyu","jiamu","daguanyuan","chaojian","jinling"]
  },
  {
    id: "xichun", title: "贾惜春", category: "人物",
    summary: "宁国府贾敬之女，冷僻孤介，终入佛门。",
    body: "贾敬之女，四姑娘，自宁府养于荣府。她性情冷僻，抄检时目睹入画被逐而愈发决绝，终看破红尘、缁衣顿改。判词“勘破三春景不长，缁衣顿改昔年妆”。",
    links: ["baoyu","jiamu","daguanyuan","miaoyu","jinling"]
  },
  {
    id: "keqing", title: "秦可卿", category: "人物",
    summary: "宁国府贾蓉之妻，早逝，托梦预示衰败。",
    body: "营缮郎秦业养女，嫁入宁国府为蓉大奶奶，风流袅娜却早夭。临终托梦凤姐，预言“盛筵必散”“三春去后诸芳尽”，是贾府由盛转衰的先声。",
    links: ["jiamu","ningguofu","jinling","taihu"]
  },
  {
    id: "liwan", title: "李纨", category: "人物",
    summary: "宝玉之嫂，贾珠遗孀，槁木死灰守节。",
    body: "金陵名宦之女，嫁贾珠，早寡，独养幼子贾兰，居稻香村。她心如“槁木死灰”，唯以课子为念；判词“桃李春风结子完，到头谁似一盆兰”，晚景因子贵而荣。",
    links: ["baoyu","tanchun","daoxiangcun","qiaojie","jinling"]
  },
  {
    id: "qiaojie", title: "贾巧姐", category: "人物",
    summary: "凤姐之女，十二钗中最幼，赖刘姥姥得救。",
    body: "王熙凤与贾琏之女，生于七夕，刘姥姥为其取名“巧姐”。家败后险被狠舅奸兄卖掉，幸得刘姥姥相救，嫁与乡绅，得以善终。",
    links: ["xifeng","jialian","liwan","jinling","liaolao"]
  },
  {
    id: "xiren", title: "袭人", category: "人物",
    summary: "宝玉首席大丫鬟，温柔和顺，贤而近礼。",
    body: "原为贾母之婢，后服侍宝玉，温柔细致、行事周全，被王夫人暗定为侍妾。她规劝宝玉走“正道”，宝玉出家后嫁与蒋玉菡。判词“堪羡优伶有福，谁知公子无缘”。",
    links: ["baoyu","qingwen","yihongyuan","baoyu_chujia","jiangyuhan"]
  },
  {
    id: "qingwen", title: "晴雯", category: "人物",
    summary: "宝玉房中丫鬟，貌美心高，屈死含冤。",
    body: "十岁入府，容貌爽利、口角锋芒，撕扇补裘显其真性情。因遭谗被王夫人撵逐，病中“勇补雀金裘”成绝唱，含冤而死。宝玉撰《芙蓉女儿诔》以祭。",
    links: ["baoyu","xiren","yihongyuan","daiyu","chaojian"]
  },
  {
    id: "xiangling", title: "香菱", category: "人物",
    summary: "甄士隐之女英莲，命运多舛，苦学作诗。",
    body: "原名甄英莲，幼年被拐，卖与薛蟠为妾，改名香菱。她命运坎坷却痴心向学，于大观园跟黛玉学诗、苦吟“月亮”终得佳句。判词“根并荷花一茎香，平生遭际实堪伤”。",
    links: ["xuepan","baochai","daiyu","baihaitang"]
  },
  {
    id: "zijuan", title: "紫鹃", category: "人物",
    summary: "黛玉的贴身丫鬟，忠心体己，情同姐妹。",
    body: "原为贾母之婢鹦哥，赐予黛玉后改名紫鹃。她待黛玉一片赤诚，曾“情辞试忙玉”探宝玉真心，黛玉临终唯她相伴。黛玉死后，随惜春出家。",
    links: ["daiyu","baoyu","xiaoxiangguan"]
  },
  {
    id: "pingr", title: "平儿", category: "人物",
    summary: "凤姐陪房丫鬟兼贾琏之妾，公道周全。",
    body: "王熙凤的得力心腹兼贾琏之妾。她身处凤姐与贾琏之间，常于夹缝中行方便、掩过失，处事公道、心地良善，是贾府众婢中最得人缘者。",
    links: ["xifeng","jialian","baochai"]
  },
  {
    id: "yuanyang", title: "鸳鸯", category: "人物",
    summary: "贾母贴身大丫鬟，誓死不作贾赦之妾。",
    body: "贾母最得力的丫鬟，掌其私房钥匙。贾赦欲纳为妾，她剪发明志、誓死不从，依赖贾母庇护。贾母死后悬梁自尽，尽节而终。",
    links: ["jiamu","jiazheng","baoyu"]
  },
  {
    id: "jialian", title: "贾琏", category: "人物",
    summary: "凤姐之夫，荣府管家少爷，风流好色。",
    body: "贾赦之子，协助料理荣府事务，与凤姐貌合神离。他贪欢好色，偷娶尤二姐，终被凤姐算计。贾府败后落魄。",
    links: ["xifeng","pingr","wangfuren","rongguofu","qiaojie"]
  },
  {
    id: "xuepan", title: "薛蟠", category: "人物",
    summary: "宝钗之兄，呆霸王，为香菱打死冯渊。",
    body: "薛家公子，人称“呆霸王”，粗鄙任性。为争香菱打死冯渊，仗财势了结官司；后娶夏金桂，家宅不宁。曾因调情柳湘莲反被痛打。",
    links: ["baochai","xiangling","xianglian"]
  },
  {
    id: "zhenshiyin", title: "甄士隐", category: "人物",
    summary: "开篇人物，英莲之父，悟道出家。",
    body: "姑苏乡宦，元宵节爱女英莲被拐，家遭火灾，投岳丈后贫病交加。于穷途遇跛足道人唱《好了歌》，彻悟出家，是“真事隐去”的隐喻。",
    links: ["yucun","haole","taihu","xiangling"]
  },
  {
    id: "yucun", title: "贾雨村", category: "人物",
    summary: "穷儒起家，攀附权贵，忘恩负义。",
    body: "胡州人氏，受甄士隐资助入京赶考，官复原职后忘恩（于英莲一案徇情枉法），攀附贾、王、薛三家。是“假语村言”的化身，最终枷锁加身。",
    links: ["zhenshiyin","baoyu","rongguofu"]
  },
  {
    id: "liaolao", title: "刘姥姥", category: "人物",
    summary: "乡野老妪，三进荣国府，知恩图报。",
    body: "板儿之姥姥，因家贫携孙进荣国府“打秋风”，以笑话逗贾母众人。三进大观园时贾府已败，她仗义救出巧姐，是全书冷暖对照的民间视角。",
    links: ["daguanyuan","xifeng","baoyu","jiamu","qiaojie"]
  },
  {
    id: "xianglian", title: "柳湘莲", category: "人物",
    summary: "落魄侠客，尤三姐之未婚夫，悔婚出家。",
    body: "原系世家子弟，萍踪浪迹、侠骨柔情。因调情戏薛蟠反痛打之，后聘尤三姐；闻其不洁疑而索剑退婚，致三姐自刎，悔恨中随道士出家。",
    links: ["xuepan","baochai","daiyu"]
  },
  {
    id: "jiangyuhan", title: "蒋玉菡", category: "人物",
    summary: "忠顺王府优伶，琪官，与宝玉交好。",
    body: "艺名琪官，色艺双绝的旦角。与宝玉互赠汗巾，其失踪引发宝玉挨打；后娶袭人为妻，应了“优伶有福”之谶。",
    links: ["baoyu","xiren","baoyu_ada"]
  },
  {
    id: "mingyan", title: "茗烟", category: "人物",
    summary: "宝玉的小厮，机灵忠勇，代为张罗。",
    body: "宝玉贴身小厮，最解主子心意。曾助宝玉私祭金钏、闹学堂，是宝玉与墙外世界往来的纽带。",
    links: ["baoyu"]
  },

  // ===================== 诗词判词 =====================
  {
    id: "jinling", title: "金陵十二钗判词", category: "诗词判词",
    summary: "正册判词，预示十二位女子命运。",
    body: "见于第五回太虚幻境薄命司橱册。以“画+诗”形式暗写林黛玉、薛宝钗、贾元春、探春、湘云、妙玉、迎春、惜春、王熙凤、巧姐、李纨、秦可卿十二位女子的结局，是全书悲剧的总纲。",
    links: ["baoyu","daiyu","baochai","xifeng","yanchun","tanchun","yingchun","xichun","keqing","liwan","qiaojie","xiangyun","miaoyu","taihu"]
  },
  {
    id: "zanghua", title: "《葬花吟》", category: "诗词判词",
    summary: "黛玉代表性长诗，悲叹身世与落花。",
    body: "第二十七回黛玉葬花时所吟。“花谢花飞飞满天，红消香断有谁怜”，以落花自况，抒写孤高、漂泊与对青春的哀挽，是黛玉性格与命运的绝唱，亦令隔墙的宝玉恸倒。",
    links: ["daiyu","daiyu_zanghua","baoyu"]
  },
  {
    id: "qiuchuang", title: "《秋窗风雨夕》", category: "诗词判词",
    summary: "黛玉仿《春江花月夜》的秋夜愁吟。",
    body: "第四十五回，秋雨凄寒，黛玉病中对景感怀，作此拟古长诗。“秋花惨淡秋草黄，耿耿秋灯秋夜长”，尽诉孤苦凄凉，与《葬花吟》同为悲音。",
    links: ["daiyu","baoyu"]
  },
  {
    id: "taohua", title: "《桃花行》", category: "诗词判词",
    summary: "黛玉后期的伤春之作，桃花如泪。",
    body: "第七十回大观园重建诗社后黛玉所作。“桃花帘外东风软……泪干春尽花憔悴”，以桃花喻己，悲音更甚，众人都知“这首桃花诗又好似《葬花吟》”。",
    links: ["daiyu","baoyu"]
  },
  {
    id: "liuxu", title: "《柳絮词》", category: "诗词判词",
    summary: "大观园末期的柳絮词社，各抒怀抱。",
    body: "第七十回，众人以柳絮为题填词。黛玉《唐多令》“草木也知愁，韶华竟白头”凄婉；宝钗《临江仙》“好风凭借力，送我上青云”旷达——二词恰映二人命运分野。",
    links: ["daiyu","baochai","xiangyun","tanchun"]
  },
  {
    id: "haole", title: "《好了歌》", category: "诗词判词",
    summary: "跛足道人所唱，洞达世情的解脱之歌。",
    body: "第一回，甄士隐困顿中遇跛足道人唱此歌：“世人都晓神仙好，惟有功名忘不了……”士隐注解其意后随道人而去，道尽“好便是了，了便是好”的色空之理。",
    links: ["zhenshiyin","yucun","taihu"]
  },
  {
    id: "shierzhi", title: "《红楼梦》十二支", category: "诗词判词",
    summary: "太虚幻境仙曲，演尽儿女悲剧。",
    body: "第五回，警幻命歌姬演唱《红楼梦》十二支，如《终身误》《枉凝眉》等，以仙音写尽宝黛钗及众女儿的痴情与悲剧，与判词互为表里。",
    links: ["jinling","baoyu","daiyu","baochai"]
  },
  {
    id: "baihaitang", title: "《咏白海棠》", category: "诗词判词",
    summary: "海棠诗社首题，闺阁才情之试。",
    body: "第三十七回，探春发起海棠诗社，以白海棠为题。黛玉“半卷湘帘半掩门”、宝钗“淡极始知花更艳”各具风神，湘云后来“眠冷翠楼”二首更夺魁，是群芳才藻的盛会。",
    links: ["daiyu","baochai","xiangling","tanchun"]
  },

  // ===================== 章回 =====================
  {
    id: "daiyu_jinfu", title: "黛玉进贾府", category: "章回",
    summary: "第三回，黛玉初入荣国府，宝黛初会。",
    body: "黛玉母亡，依贾母之命进京投亲。她步步留心、时时在意，初见贾母众人，与宝玉“木石前盟”初遇——“这个妹妹我曾见过的”，一見如故，亦埋下终身情孽。",
    links: ["daiyu","baoyu","jiamu","rongguofu"]
  },
  {
    id: "yuanchun_xingqin", title: "元春省亲", category: "章回",
    summary: "第十七至十八回，贵妃归省，大观园落成。",
    body: "贾元春加封贤德妃，蒙恩归省。为接驾建盖省亲别墅——大观园，匾题“有凤来仪”“潇湘馆”等。烈火烹油、鲜花着锦之盛，却暗藏“盛筵必散”的悲音。",
    links: ["yanchun","baoyu","daguanyuan","rongguofu"]
  },
  {
    id: "baoyu_ada", title: "宝玉挨打", category: "章回",
    summary: "第三十三回，忠顺王府索琪官、金钏之死激怒贾政。",
    body: "忠顺王府来索蒋玉菡，又值金钏投井、贾环诬告，贾政怒不可遏，将宝玉狠加笞挞。黛玉“眼睛肿得桃儿一般”来探，是宝黛情深的转折，亦见父子礼教冲突。",
    links: ["baoyu","jiazheng","daiyu","jiangyuhan","xifeng"]
  },
  {
    id: "daiyu_zanghua", title: "黛玉葬花", category: "章回",
    summary: "第二十七回，黛玉荷锄葬花，吟《葬花吟》。",
    body: "暮春之日，黛玉见落花满地，恐其遭践，以锦囊收之、净土掩埋，并泣吟《葬花吟》。宝玉隔墙闻之恸倒，二人情感在花冢前更深一层。",
    links: ["daiyu","baoyu","zanghua","xiaoxiangguan"]
  },
  {
    id: "chaojian", title: "抄检大观园", category: "章回",
    summary: "第七十四回，绣春囊引发的大观园清洗。",
    body: "因大观园拾得绣春囊，王夫人命凤姐夜抄诸处。探春怒扇王善保家的，晴雯倒匣抗辩，入画、司棋被逐。此为贾府内部倾轧与女儿悲剧的高潮序幕。",
    links: ["xifeng","tanchun","baoyu","daguanyuan","qingwen","yingchun"]
  },
  {
    id: "daiyu_fengao", title: "黛玉焚稿", category: "章回",
    summary: "第九十七回，黛玉闻宝玉娶宝钗，焚稿断痴。",
    body: "傻大姐泄密，黛玉惊悉“金玉”之姻。她万念俱灰，将题诗旧帕与诗稿付诸一炬，焚尽痴情。恰在宝玉宝钗成婚之时，她泪尽而亡，“质本洁来还洁去”。",
    links: ["daiyu","baoyu","baochai","zijuan"]
  },
  {
    id: "baoyu_chujia", title: "宝玉出家", category: "章回",
    summary: "第一百二十回，宝玉中举后悬崖撒手。",
    body: "贾府败而复振，宝玉赴考中举后飘然离去。雪中拜别贾政，仰天“走了”而去，应了“落了片白茫茫大地真干净”。僧道携那块顽石归彼大荒，全书收束于色空。",
    links: ["baoyu","daiyu","xiren","taihu"]
  },
  {
    id: "taihu", title: "太虚幻境", category: "章回",
    summary: "第五回，宝玉梦游幻境，窥见命运簿册。",
    body: "宝玉随可卿入梦，至太虚幻境，于薄命司阅金陵十二钗正副又副册判词，听《红楼梦》十二支仙曲，饮“千红一窟”“万艳同杯”。此为全书悲剧的预示总纲。",
    links: ["baoyu","keqing","haole","jinling","zhenshiyin"]
  },

  // ===================== 地点 =====================
  {
    id: "daguanyuan", title: "大观园", category: "地点",
    summary: "元春省亲别墅，众儿女诗意栖居之地。",
    body: "为元春归省而建的大型园林，省亲后令宝玉与诸钗入住。园中亭台参差、花木繁盛，是青春与诗意的乐土，也是悲剧上演的舞台。终随家族败落而寥落。",
    links: ["baoyu","daiyu","baochai","xiangyun","yuanchun_xingqin","yihongyuan","xiaoxiangguan","hengwuyuan","daoxiangcun","longcuan","liaolao"]
  },
  {
    id: "rongguofu", title: "荣国府", category: "地点",
    summary: "荣国公之后，贾母一支的府邸。",
    body: "荣国公贾源之府，贾母、贾政、贾赦两支同居。小说主要场景，钟鸣鼎食、诗礼簪缨，府第极尽奢华，亦是家族权力与兴衰的中心。",
    links: ["jiamu","jiazheng","baoyu","daiyu_jinfu","jialian"]
  },
  {
    id: "ningguofu", title: "宁国府", category: "地点",
    summary: "宁国公之后，贾珍一支的府邸。",
    body: "宁国公贾演之府，与荣府为“宁荣街”二宅。贾敬炼丹、贾珍父子骄奢，秦可卿丧事极尽铺张，是“箕裘颓堕皆从敬”的败落之源。",
    links: ["keqing","jiamu"]
  },
  {
    id: "yihongyuan", title: "怡红院", category: "地点",
    summary: "宝玉的居所，“怡红快绿”之处。",
    body: "大观园中宝玉之住处，院中植芭蕉、海棠，匾曰“怡红快绿”。窗明几净、丫鬟环绕，是宝玉与女儿们最缠绵的天地，亦藏“寿怡红群芳开夜宴”之欢。",
    links: ["baoyu","xiren","qingwen"]
  },
  {
    id: "xiaoxiangguan", title: "潇湘馆", category: "地点",
    summary: "黛玉的居所，翠竹清幽，有凤来仪。",
    body: "大观园中黛玉之住处，原名“有凤来仪”，千竿翠竹、清泉绕阶，最合黛玉孤高之性。她于此葬花、焚稿，泪尽而逝，竹影犹带潇湘之愁。",
    links: ["daiyu","zijuan","daiyu_zanghua"]
  },
  {
    id: "hengwuyuan", title: "蘅芜苑", category: "地点",
    summary: "宝钗的居所，香草满院，雪洞般素净。",
    body: "大观园中宝钗之住处，匾曰“蘅芷清芬”，院中多奇草异香，室内却“雪洞一般”、一色玩器全无，恰映宝钗“淡极始知花更艳”的素净性情。",
    links: ["baochai"]
  },
  {
    id: "daoxiangcun", title: "稻香村", category: "地点",
    summary: "李纨的居所，杏帘在望的田园。",
    body: "大观园中李纨之住处，黄泥矮墙、稻茎遮就，一派农家风物，元春赐名“稻香村”。李纨于此守寡课子，是园中少有的“平淡”之地。",
    links: ["liwan"]
  },
  {
    id: "longcuan", title: "栊翠庵", category: "地点",
    summary: "妙玉修行之所，幽洁出尘。",
    body: "大观园中带发修行的尼庵，妙玉居此。院中梅花清绝，她以“槛外人”自居，却“云空未必空”。品茶栊翠庵一段，尽显其孤高与隐情。",
    links: ["miaoyu"]
  },
];
