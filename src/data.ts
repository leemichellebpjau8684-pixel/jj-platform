import { Order, Landmark } from './types';

export const SHANGHAI_DISTRICTS = [
  '黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', 
  '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区', 
  '松江区', '青浦区', '奉贤区', '崇明区'
];

export const GRADES = [
  '小学', '初中', '高中', '幼儿启蒙'
];

export const SUBJECTS = [
  '数学', '英语', '物理', '化学', '语文', '生物', '地理', '理综', '文综', '数理化'
];

// High-fidelity Shanghai High School and University landmarks
export const SHANGHAI_UNIVERSITIES: Landmark[] = [
  {
    id: 'fudan_hd',
    name: '复旦大学 (邯郸校区)',
    address: '杨浦区五角场邯郸路220号',
    coordinate: { lat: 31.2989, lng: 121.5035 },
    type: 'university'
  },
  {
    id: 'fudan_fl',
    name: '复旦大学 (枫林校区)',
    address: '徐汇区医学院路138号',
    coordinate: { lat: 31.1963, lng: 121.4552 },
    type: 'university'
  },
  {
    id: 'sjtu_mh',
    name: '上海交通大学 (闵行校区)',
    address: '闵行区东川路800号',
    coordinate: { lat: 31.0258, lng: 121.4307 },
    type: 'university'
  },
  {
    id: 'sjtu_xh',
    name: '上海交通大学 (徐汇校区)',
    address: '徐汇区华山路1954号',
    coordinate: { lat: 31.2015, lng: 121.4365 },
    type: 'university'
  },
  {
    id: 'tongji_sp',
    name: '同济大学 (四平路校区)',
    address: '杨浦区四平路1239号',
    coordinate: { lat: 31.2842, lng: 121.5036 },
    type: 'university'
  },
  {
    id: 'ecnu_mh',
    name: '华东师范大学 (闵行校区)',
    address: '闵行区东川路500号',
    coordinate: { lat: 31.0315, lng: 121.4526 },
    type: 'university'
  },
  {
    id: 'ecnu_zsb',
    name: '华东师范大学 (中山北路校区)',
    address: '普陀区中山北路3663号',
    coordinate: { lat: 31.2272, lng: 121.4072 },
    type: 'university'
  },
  {
    id: 'shu_bs',
    name: '上海大学 (宝山校区)',
    address: '宝山区上大路99号',
    coordinate: { lat: 31.3175, lng: 121.3912 },
    type: 'university'
  },
  {
    id: 'shisu_sb',
    name: '上海外国语大学 (松江校区)',
    address: '松江区文翔路1550号',
    coordinate: { lat: 31.0483, lng: 121.2078 },
    type: 'university'
  },
  {
    id: 'dhu_sj',
    name: '东华大学 (松江校区)',
    address: '松江区人民北路2999号',
    coordinate: { lat: 31.0375, lng: 121.2155 },
    type: 'university'
  }
];

// Core structured simulated database of current active tutoring orders in Shanghai
export const SEED_ORDERS: Order[] = [
  {
    id: 'SH-2026-64101',
    district: '杨浦区',
    grade: '高中',
    subject: '数学',
    coordinate: { lat: 31.3021, lng: 121.5123 }, // Near Tongji/Fudan (~1.3km)
    address: '政通路138弄三和花园',
    studentDesc: '高一女生，数学月考成绩稳定在70-80分（满分150），函数几何逻辑薄弱，渴望突破及格线。期待系统知识点点睛。',
    studentDetail: '学生性格比较活泼好学，课上态度端正。但没有举一反三的习惯，常常生搬硬套公式。每周需要辅导学校当天作业以外的核心概念梳理，带着梳理错题本，引导发散思维。',
    frequency: '每周2次，每次2小时 (建议周六下午 + 周日晚上)',
    requirements: '杨浦五角场周边高校在校大学生（复旦、同济优先），熟悉上海新高考题型，上课有耐心，表达逻辑清晰利索。',
    price: 90,
    isHighPrice: false,
    isOnline: false,
    isCollegeStudent: true,
    isNegotiable: false,
    contactTeacher: '杨老师',
    publishTime: '2小时前'
  },
  {
    id: 'SH-2026-64102',
    district: '闵行区',
    grade: '高中',
    subject: '物理',
    coordinate: { lat: 31.0298, lng: 121.4112 }, // Near SJTU Minhang (~2.0km)
    address: '沧源路880弄校区公寓二期',
    studentDesc: '高三男生，物理基础一般，电磁学和力学综合题丢分严重。高考物理目标在B等以上。',
    studentDetail: '学生现在正在进行一轮、二轮专项复习阶段，平时做基础单选题尚可，但在大型物理情景分析、受力分析以及传感器多重叠加题型里往往束手无策。需要对典型高考题进行剖析，寻找手感。',
    frequency: '每周1次，每次3小时 (周日全天可选)',
    requirements: '上海交大/华师大闵行校区理科优秀大学生。男女不限，物理功底必须极硬，能手写解出近年高考压轴物理题。',
    price: 130,
    isHighPrice: true,
    isOnline: false,
    isCollegeStudent: true,
    isNegotiable: false,
    contactTeacher: '谢老师',
    publishTime: '10分钟前'
  },
  {
    id: 'SH-2026-64103',
    district: '静安区',
    grade: '初中',
    subject: '英语',
    coordinate: { lat: 31.2384, lng: 121.4451 }, // 静安寺附近 (Central)
    address: '愚园路400号向阳里二期',
    studentDesc: '初二女生，英语听说能力薄弱，语法填空及完形填空错题率高，急需攻克中考语法框架。',
    studentDetail: '学生平时词汇量处于中偏上水平，但在主谓一致、时态语态以及从句的运用上丢分非常规律。需要老师每堂课讲解1-2个语法专题，并搭配针对性的精细练习，进行语法盲区清盘。',
    frequency: '每周2次，每次2小时 (周一、周四晚上19:00-21:00)',
    requirements: '上海高校大二、大三英语相关专业大学生，或持有四六级/专八高分证书。女生优先，发音标准纯正。',
    price: 85,
    isHighPrice: false,
    isOnline: false,
    isCollegeStudent: true,
    isNegotiable: false,
    contactTeacher: '王老师',
    publishTime: '1小时前'
  },
  {
    id: 'SH-2026-64104',
    district: '徐汇区',
    grade: '初中',
    subject: '化学',
    coordinate: { lat: 31.1895, lng: 121.4398 }, // Near SJTU Xuhui / Medical campus
    address: '宛平南路380弄宛南小区',
    studentDesc: '初三女生，面临中考。化学酸碱盐部分错题很多，希望对实验探究及计算压轴题进行专项辅导。',
    studentDetail: '期中考试由于化学实验和推断题失误未能进入第一梯队。思路稍微有些局限，遇到开放式实验题不知道从何写起。需要老师对常见的金属氧化物、酸碱盐推断进行技巧性训练。',
    frequency: '每周1次，每次2.5小时 (周六晚上)',
    requirements: '复旦、交大或华师大化院等相关理科专业大学生。有良好沟通能力，备课细致，擅长把微观化学键转化为易懂语言。',
    price: 150,
    isHighPrice: true,
    isOnline: false,
    isCollegeStudent: true,
    isNegotiable: false,
    contactTeacher: '韩老师',
    publishTime: '刚刚'
  },
  {
    id: 'SH-2026-64105',
    district: '浦东新区',
    grade: '小学',
    subject: '语文',
    coordinate: { lat: 31.2215, lng: 121.5435 }, // 世纪公园附近
    address: '丁香路1089弄浦东仁恒森兰',
    studentDesc: '小升初五年级男生，语文阅读理解极差，写作抓不住重点，缺乏条理。需要教授解题得分点。',
    studentDetail: '平时读书不少，但属于“浅阅读”状态，不爱思考深层含义。写作文多以平铺直叙为主，字数够了但毫无打动人的细节。急教阅读采分点拆解和快速拟写提纲的应试手段。',
    frequency: '每周1次，每次2小时 (周六上午)',
    requirements: '上海高校汉语言文学、教育学相关专业师范生优先，有小学奥语或新概念作文辅导经验者更佳。',
    price: 80,
    isHighPrice: false,
    isOnline: false,
    isCollegeStudent: true,
    isNegotiable: false,
    contactTeacher: '杨老师',
    publishTime: '3小时前'
  },
  {
    id: 'SH-2026-64106',
    district: '闵行区',
    grade: '高中',
    subject: '理综',
    coordinate: { lat: 31.0312, lng: 121.4421 }, // Very near SJTU Minhang & ECNU Minhang (~1km)
    address: '东川路永平路交界金榜世家',
    studentDesc: '高三女生，理科不理想，数物理学偏弱。需要理综三科（物理、化学、生物）同步诊断纠偏。',
    studentDetail: '高三复习越往后感觉理综越吃力，答题卡分配时间混乱，卷面分在各处白白流失。希望老师能够以近五年的真卷为轴，传授考场分配策略和高分踩点分。',
    frequency: '每周3次，每次2小时 (周二、四、六晚)',
    requirements: '具有高中理科竞赛背景或新高考高分考入交大/复旦的学霸学长、学姐。授课逻辑极强，执行力高。',
    price: 160,
    isHighPrice: true,
    isOnline: false,
    isCollegeStudent: true,
    isNegotiable: false,
    contactTeacher: '张老师',
    publishTime: '5小时前'
  },
  {
    id: 'SH-2026-64107',
    district: '徐汇区',
    grade: '高中',
    subject: '数学',
    coordinate: { lat: 31.1541, lng: 121.4112 }, // 徐汇梅陇/华理周围
    address: '龙州路955号梅陇三村',
    studentDesc: '【高薪急聘】高三文科生（高考考数学），主要针对高招解析几何和导数这两道压轴大题，希望能总结通性通法。',
    studentDetail: '基础很好，全班排名级前20%，但数学是拉开顶级名校差距的软肋。解析几何运算老是出错，导数分类讨论不彻底。需要老师直接上手最前沿的方法进行降维打击，传授破局公式。',
    frequency: '每周2次，每次2.5小时 (周六下午 + 周日全天可选)',
    requirements: '极具家教说服力和极优绩点的理科尖子。交大、复旦数院或工科大神，讲课能迅速直切几何辅助线本质，不照本宣科。',
    price: 200,
    isHighPrice: true,
    isOnline: false,
    isCollegeStudent: true,
    isNegotiable: false,
    contactTeacher: '王老师',
    publishTime: '1天前'
  },
  {
    id: 'SH-2026-64108',
    district: '徐汇区',
    grade: '高中',
    subject: '数理化',
    coordinate: { lat: 31.1891, lng: 121.4285 }, // Near Medical / Xuhui
    address: '斜土路2420号汇翠花园',
    studentDesc: '高二男生，数理化三科总体处于中等，需要全面查漏补缺，辅导平时功课和预习新课。',
    studentDetail: '上普通的高中，学校作业虽然交了但掌握不扎实，理科知识概念有些乱。需要一位能够每周带着订正，监督错题，并制定详细周度复习大纲的温柔的大哥哥或大姐姐。',
    frequency: '每周2次，每次2小时 (时间可商议)',
    requirements: '交大、医学院或东华等名校在校教员，富有责任心、性格温和有底线，能够引导高二男生形成严谨学习习惯。',
    price: 0, // Pending / Negotiable
    isHighPrice: false,
    isOnline: false,
    isCollegeStudent: true,
    isNegotiable: true,
    contactTeacher: '王老师',
    publishTime: '12小时前'
  },
  {
    id: 'SH-2026-64109',
    district: '松江区',
    grade: '初中',
    subject: '数学',
    coordinate: { lat: 31.0521, lng: 121.2215 }, // 松江大学城站/文翔路附近
    address: '文翔路2000弄英郡别苑',
    studentDesc: '【松江高价】初三学生，数学成绩面临中考分水岭，几何辅助线怎么也想不出来，急选经验丰富的老师点拨。',
    studentDetail: '几何中考常考的“旋转、折叠、最值”等经典模型无法熟练对应。做压轴题只做第一小问，后面往往交白卷。希望有富有中考提分经验的大学师姐提供破茧讲题法。',
    frequency: '每周1-2次，每次2小时 (建议周末下午)',
    requirements: '松江大学城在校生（上外、东华等优先），熟悉初中数学模型，解题技巧纯熟，能活跃课堂气氛。',
    price: 120,
    isHighPrice: true,
    isOnline: false,
    isCollegeStudent: true,
    isNegotiable: false,
    contactTeacher: '顾老师',
    publishTime: '4小时前'
  },
  {
    id: 'SH-2026-64110',
    district: '黄浦区',
    grade: '小学',
    subject: '英语',
    coordinate: { lat: 31.2184, lng: 121.4721 }, // 黄浦打浦桥周围
    address: '鲁班路168弄大兴小区',
    studentDesc: '小学四年级女生，校内英语拔尖，欲备战KET/PET考试并学习新概念英语一，需要提高词汇和语感。',
    studentDetail: '家庭整体英语环境较好，孩子口语流利，但对PET阅读的大量学术词语以及小长句子的拆解存在隔阂。需要有体系地引导孩子积累词根词缀，纠正拼写格式并讲解《新概念二》经典段落。',
    frequency: '每周1次，每次2小时 (周日上午09:00-11:00)',
    requirements: '上海名校外语类教员，要求英语口音极其地道，最好有托福高分或海外游学交换经历。女生优先。',
    price: 95,
    isHighPrice: false,
    isOnline: false,
    isCollegeStudent: true,
    isNegotiable: false,
    contactTeacher: '刘老师',
    publishTime: '3天前'
  },
  {
    id: 'SH-2026-64111',
    district: '徐汇区',
    grade: '小学',
    subject: '数学',
    coordinate: { lat: 31.1852, lng: 121.4399 }, // Near fl
    address: '龙华路2518弄盛大花园',
    studentDesc: '全线上课程。小学三年级思维训练。引导数学课外拓展内容，锻炼计算和逻辑。',
    studentDetail: '纯在线视频辅导，省去来回路上通勤耗时。希望找一个在校名校大哥哥大姐姐，每次讲授高精度思维小模块，比如数阵图、还原问题。课程气氛需要欢快生动。',
    frequency: '每周2次，每次1.5小时 (周二、周四晚上19:30-21:00)',
    requirements: '上交、复旦等一流水工科大一大二学生，富有童心，思维敏捷，上课能用IPAD共享白板生动绘图讲解。',
    price: 110,
    isHighPrice: false,
    isOnline: true,
    isCollegeStudent: true,
    isNegotiable: false,
    contactTeacher: '杨老师',
    publishTime: '2天前'
  },
  {
    id: 'SH-2026-64112',
    district: '浦东新区',
    grade: '幼儿启蒙',
    subject: '英语',
    coordinate: { lat: 31.2425, lng: 121.5126 }, // 陆家嘴/碧云板块
    address: '桃林路815弄中星雅苑',
    studentDesc: '【高薪线上】5岁小女孩，平时用英文绘本启蒙。需要找个活泼的复旦交大名校姐姐，每周在ZOOM上通过看图读绘本、角色扮演口语交流。',
    studentDetail: '孩子从小在全英绘本环境中磨耳朵，听力不错，但由于缺少真实对话伙伴，不敢大声自主输出整句。需要老师温柔地通过游戏、说唱、角色反串，带动宝宝把口语运用出来。',
    frequency: '每周3次，每次1小时 (周一、三、五傍晚18:00-19:00)',
    requirements: '纯英文听说流利，发音接近母语者级别。对小龄儿童极有亲和力与包容力，能设计出活泼的幻灯片交互游戏。',
    price: 150,
    isHighPrice: true,
    isOnline: true,
    isCollegeStudent: true,
    isNegotiable: false,
    contactTeacher: '白老师',
    publishTime: '6小时前'
  },
  {
    id: 'SH-2026-64113',
    district: '松江区',
    grade: '高中',
    subject: '化学',
    coordinate: { lat: 31.0454, lng: 121.1998 }, // 松江区
    address: '新松江路1288弄世纪新城',
    studentDesc: '高三学生化学总复习。基础一般，需要针对高考最后化学推断、有机选择等关键板块深度讲明白题型归纳。',
    studentDetail: '目前卡在化学一轮复习和专题练习中，尤其是“有机物性质、晶胞密度的换算”算不清楚，信心有些受挫。盼望一位功底扎实能列框架的老师。',
    frequency: '每周1次，每次3小时 (周日早晨09:00-12:00)',
    requirements: '理工科名校资深大学生教员（男女不限），有一整套备战高考高分化学的笔记及方法论。',
    price: 0,
    isHighPrice: false,
    isOnline: false,
    isCollegeStudent: true,
    isNegotiable: true,
    contactTeacher: '彭老师',
    publishTime: '1天前'
  },
  {
    id: 'SH-2026-64114',
    district: '杨浦区',
    grade: '初中',
    subject: '语文',
    coordinate: { lat: 31.3121, lng: 121.5015 }, // Near fudan_hd
    address: '国定路500弄复旦教师公寓',
    studentDesc: '初一男生，古诗词及文言文阅读完全不懂翻译，每次做课外文言文基本猜题，学校周考偏科严重。',
    studentDetail: '字词积累薄弱，拿到文言文就脑胀。希望找一个有毅力、严字当头、能够给孩子每堂课落实文言名词实词用法、督促默写诗歌并剖析答题路径的教员。',
    frequency: '每周2次，每次2小时 (周三、周五晚五点)',
    requirements: '复旦/同济的人文相关专业优秀高年级教员。踏实认真负责，能给初一生做表率，每周能留下手写反馈笔记。',
    price: 85,
    isHighPrice: false,
    isOnline: false,
    isCollegeStudent: true,
    isNegotiable: false,
    contactTeacher: '杨老师',
    publishTime: '5天前'
  },
  {
    id: 'SH-2026-64115',
    district: '宝山区',
    grade: '初中',
    subject: '数学',
    coordinate: { lat: 31.3218, lng: 121.4012 }, // Near SHU Baoshan campus
    address: '聚丰园路188弄当代高邸',
    studentDesc: '初二男生，数学极度偏科，代数整式乘法与因式分解错误百出，二次根式一算就错，导致作业拖延。',
    studentDetail: '上课专注度只有半小时，后面小动作颇多。希望找一个能和高大有震慑力、又能像哥哥一样沟通的师兄。帮他把计算的基本习惯拧过来，课上做高密度计算卡训练。',
    frequency: '每周2次，每次2小时 (周二、周四晚上18:30-20:30)',
    requirements: '上海大学宝山校区在校理科教员，有家教责任心。擅长和贪玩男生高效沟通，男女不限。',
    price: 80,
    isHighPrice: false,
    isOnline: false,
    isCollegeStudent: true,
    isNegotiable: false,
    contactTeacher: '王老师',
    publishTime: '12小时前'
  }
];
