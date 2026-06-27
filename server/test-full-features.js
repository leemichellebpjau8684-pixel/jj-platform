const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const BASE_URL = 'http://localhost:3001/api';

const testOrders = [
  {
    order_no: '2026061801',
    title: '暑假7月开始 七升八年级英语补基础',
    subject: '英语',
    education_stage: '初中',
    grade_detail: '七升八年级',
    district: '浦东新区',
    address: '浦东惠南观海路1588弄',
    teaching_type: '上门',
    salary_min: 120,
    salary_max: 130,
    requirements: '男女不限，985211有辅导经验，有耐心，有责任心。一对一老师上门，每周4-5次，每次2小时，周一到周五上课。',
    source: '微信接单',
    raw_content: '家教编号：2026061801#暑假7月开始\n学员地址：浦东惠南观海路1588弄\n学员情况：七升八年级，男孩，想补英语 补基础 ，一对一老师上门\n时间安排：每周 4-5次；每次2小时   周一到周五上课\n教员要求：男女不限，985211有辅导经验，有耐心，有责任心。\n老师薪水：120-130元/小时'
  },
  {
    order_no: '2026061807',
    title: '暑假开始 二升三年级语数外基础辅导',
    subject: '语数外',
    education_stage: '小学',
    grade_detail: '二升三年级',
    district: '普陀区',
    address: '普陀区白玉路隆德路附近',
    teaching_type: '上门',
    salary_min: 80,
    salary_max: 80,
    requirements: '男女不限，有辅导经验，有耐心，有责任心。一对一老师上门，每周1次，每次2小时，中间休息15分。',
    source: '微信接单',
    raw_content: '家教编号：2026061807#暑假开始\n学员地址：普陀区白玉路隆德路附近\n学员情况：二升三年级男孩  基础弱，需要补语数外 一对一老师上门\n时间安排：每周 1次；每次2小时   中间休息15分\n教员要求：男女不限，有辅导经验，有耐心，有责任心。\n老师薪水：80元/小时'
  },
  {
    order_no: '2026061809',
    title: '暑假开始 四升五女生全科辅导侧重英语',
    subject: '英语',
    education_stage: '小学',
    grade_detail: '四升五年级',
    district: '徐汇区',
    address: '徐汇区龙瑞路77弄中海瀛台二期',
    teaching_type: '上门',
    salary_min: 10000,
    salary_max: 10000,
    requirements: '女老师，能长期稳定带暑假，性格活泼开朗，形象气质佳，能带动孩子学习，平时作业或周末运动均可，有家教经验，有责任心。每周7次，每次2小时，周中晚上辅导作业，周末全天陪伴。',
    source: '微信接单',
    raw_content: '家教编号：2026061809#暑假开始\n学员地址：徐汇区.龙瑞路77弄中海瀛台二期\n辅导科目：全科辅导#侧重英语\n学员情况：四升五、女生，基础扎实，查缺补漏答疑解惑，巩固基础+预科，一对一老师上门。\n时间安排：每周7次，每次2小时，#周中晚上辅导作业，周末全天陪伴\n教员要求：女老师，能长期稳定带暑假，性格活泼开朗，形象气质佳，能带动孩子学习，平时作业或周末运动均可，有家教经验，有责任心。\n老师薪水：10000元/月'
  },
  {
    order_no: '2026061822',
    title: '暑假单 三升四数学英语辅导',
    subject: '数学英语',
    education_stage: '小学',
    grade_detail: '三升四年级',
    district: '宝山区',
    address: '宝山区万科四季花园城',
    teaching_type: '上门',
    salary_min: 100,
    salary_max: 100,
    requirements: '男女老师都可，有耐心负责任，有相关家教经验。每周5次，具体时间可协商，每次2小时，七月初开始。',
    source: '微信接单',
    raw_content: '家教编号：2026061822（回）\n上海（暑假单）长期\n三升四\n【科目】数学英语\n【上课时间】每周5次，具体时间可协商，每次2小时，七月初开始\n【薪资】100/小时\n【地点】宝山区万科四季花园城\n【学生】男孩，基础偏弱\n【要求】男女老师都可，有耐心负责任， 有相关家教经验'
  },
  {
    order_no: '2026061810',
    title: '暑假开始 五年级男孩数学英语辅导',
    subject: '数学英语',
    education_stage: '小学',
    grade_detail: '五年级',
    district: '虹口区',
    address: '虹口第四人民医院附近',
    teaching_type: '上门',
    salary_min: 240,
    salary_max: 240,
    requirements: '男女不限，有辅导经验，有耐心，有责任心。一对一老师上门，每周2次，每次3小时。',
    source: '微信接单',
    raw_content: '家教编号：2026061810#暑假开始七月八月两个月都上课\n学员地址：虹口第四人民医院附近\n学员情况：五年级，男孩，数学英语一对一老师上门\n时间安排：每周 2次；每次3小时\n教员要求：男女不限，有辅导经验，有耐心，有责任心。\n老师薪水：240/次课'
  },
  {
    order_no: '2026061812',
    title: '暑假开始 初二升初三英语辅导',
    subject: '英语',
    education_stage: '初中',
    grade_detail: '初二升初三',
    district: '嘉定区',
    address: '嘉定新城地铁站这边',
    teaching_type: '上门',
    salary_min: 200,
    salary_max: 200,
    requirements: '男女不限，有辅导经验，有耐心，有责任心。一对一老师上门，每周2-3次，陪读半天，3小时左右，主要是英语，其他的顺带，预习，检查下作业，抽默背诵等。',
    source: '微信接单',
    raw_content: '家教编号：2026061812#暑假开始\n学员地址：嘉定新城地铁站这边\n学员情况：初二升初三 男孩，主要是英语，其他的顺带，预习，检查下作业 ，抽默背诵等，一对一老师上门\n时间安排：每周 2-3次；陪读半天，3小时左右\n教员要求：男女不限，有辅导经验，有耐心，有责任心。\n老师薪水：200/次'
  },
  {
    order_no: '2026061725',
    title: '暑假开始 二年级男孩跑步跳绳辅导',
    subject: '体育',
    education_stage: '小学',
    grade_detail: '二年级升三年级',
    district: '徐汇区',
    address: '徐汇区徐家汇番禺路',
    teaching_type: '上门',
    salary_min: 120,
    salary_max: 150,
    requirements: '男女不限，体育生，专业，有辅导经验，有耐心，有责任心。一对一老师上门，每周4-5次，每次1小时，周一到周五下午5-6点不热的时候。帮助小朋友跑步+跳绳，小朋友跑步姿势有问题，需要科学方法纠正。',
    source: '微信接单',
    raw_content: '家教编号：2026061725#暑假开始\n学员地址：徐汇区徐家汇番禺路\n学员情况：二年级男孩，新三年级，主要帮助小朋友跑步+跳绳 ，小朋友跑步姿势有问题，需要科学方法纠正 一对一老师上门\n时间安排：每周 4-5次；每次1小时   周一到周五下午5-6点不热的时候\n教员要求：男女不限，体育生，专业，有辅导经验，有耐心，有责任心。\n老师薪水：120-150元/小时'
  },
  {
    order_no: '2026061609',
    title: '暑假开始 二升三男孩英语复习预习',
    subject: '英语',
    education_stage: '小学',
    grade_detail: '二升三年级',
    district: '普陀区',
    address: '普陀区中山北二路99弄大运盛小区',
    teaching_type: '上门',
    salary_min: 100,
    salary_max: 100,
    requirements: '男女不限，有辅导经验，有耐心，有责任心。一对一老师上门，每周2次，每次2小时。6月22号到6月底可以试课7月13号开始。补英语，复习+预习新课，能把学过的字词句再复习一下，学过的语法能够运用起来，再把三年级会涉及到的提前学一学。',
    source: '微信接单',
    raw_content: '家教编号：2026061609#6月22号到6月底可以试课7月13号开始\n学员地址：普陀区中山北二路99弄大运盛小区\n学员情况：二升三  男孩，补英语，复习+预习新课，能把学过的字词句再复习一下 学过的语法能够运用起来 再把三年级会涉及到的提前学一学一对一老师上门\n时间安排：每周 2次；每次2小时\n教员要求：男女不限，有辅导经验，有耐心，有责任心。\n老师薪水：100元/小时'
  },
  {
    order_no: '2026061622',
    title: '暑假开始 高一升高二男孩英语辅导',
    subject: '英语',
    education_stage: '高中',
    grade_detail: '高一升高二',
    district: '浦东新区',
    address: '浦东四季雅苑',
    teaching_type: '上门',
    salary_min: 150,
    salary_max: 150,
    requirements: '男女不限，上外的，有辅导经验，有耐心，有责任心。一对一老师上门，每周4次，每次1.5小时。',
    source: '微信接单',
    raw_content: '家教编号：2026061622#暑假开始\n学员地址：浦东四季雅苑\n学员情况：高一，下半年高二，男孩，补英语，一对一老师上门\n时间安排：每周 4次；每次1.5小时\n教员要求：男女不限，上外的，有辅导经验，有耐心，有责任心。\n老师薪水：150元/小时'
  },
  {
    order_no: '2026061703',
    title: '暑假开始 三年级男生陪读',
    subject: '全科陪读',
    education_stage: '小学',
    grade_detail: '三年级',
    district: '浦东新区',
    address: '浦东新区栖山路居家桥路',
    teaching_type: '上门',
    salary_min: 100,
    salary_max: 120,
    requirements: '女老师，最好是华师大、上师大的有辅导经验，有耐心，有责任心。一对一老师上门，每周1-2次，一次两小时。',
    source: '微信接单',
    raw_content: '家教编号：2026061703#暑假开始\n学员地址：浦东新区栖山路居家桥路\n学员情况：三年级、男生，陪读，一对一老师上门\n时间安排：每周1-2次，一次两小时\n教员要求：女老师，最好是华师大、上师大的有辅导经验，有耐心，有责任心。\n老师薪水：100-120元/小时'
  },
  {
    order_no: '2026061705',
    title: '暑假开始 中班升大班英语绘本自然拼读',
    subject: '英语',
    education_stage: '幼儿',
    grade_detail: '中班升大班',
    district: '徐汇区',
    address: '徐汇区公安大楼附近',
    teaching_type: '上门',
    salary_min: 100,
    salary_max: 120,
    requirements: '男女不限，985211英语好，擅长和小朋友相处，耐心，英语发音比较标准，有辅导经验，有耐心，有责任心。一对一老师上门，每周3次，每次2小时。主要是读绘本，英语自然拼读。',
    source: '微信接单',
    raw_content: '家教编号：2026061705#暑假开始\n学员地址：徐汇区公安大楼附近\n学员情况：中班升大班，男孩，想找亲和力好一点老师 主要是读绘本 英语自然拼读 一对一老师上门\n时间安排：每周3 次；每次2小时\n教员要求：男女不限，985211英语好，擅长和小朋友相处，耐心，英语发音比较标准，有辅导经验，有耐心，有责任心。\n老师薪水：100-120元/小时'
  },
  {
    order_no: '2026061709',
    title: '暑假开始 二升三女孩全科辅导',
    subject: '全科',
    education_stage: '小学',
    grade_detail: '二年级升三年级',
    district: '杨浦区',
    address: '杨浦区黄兴路地铁站',
    teaching_type: '上门',
    salary_min: 80,
    salary_max: 80,
    requirements: '女老师，有辅导经验，有耐心，有责任心。一对一老师上门，每周5次，6.29-8.28，周一到周五上午9:30-11:30。',
    source: '微信接单',
    raw_content: '家教编号：2026061709#暑假开始\n学员地址：杨浦区黄兴路地铁站\n学员情况：二年级升三年级 女孩 ，一对一老师上门\n时间安排：每周5 次；  6.29 - 8.28，周一到周五上午9:30-11:30，(7.1,7.2,7.15,7.16,7.29,7.30,8.12,8.13时间改为14:00-15:30)\n教员要求：女老师，有辅导经验，有耐心，有责任心。\n老师薪水：80元/小时'
  },
  {
    order_no: '2026061708',
    title: '暑假7月开始 六升七女孩陪读',
    subject: '全科陪读',
    education_stage: '初中',
    grade_detail: '六升七年级',
    district: '浦东新区',
    address: '浦东金桂家园',
    teaching_type: '上门',
    salary_min: 6000,
    salary_max: 6000,
    requirements: '女老师，有辅导经验，有耐心，有责任心。一对一老师上门，每周6次，每次4小时，周一到周六下午1-5点。陪着孩子学习，监督，不会的辅导讲解一下。',
    source: '微信接单',
    raw_content: '家教编号：2026061708#暑假7月开始\n学员地址：浦东金桂家园\n学员情况：六升七 女孩，陪读，陪着孩子学习，监督，不会的辅导讲解一下 一对一老师上门\n时间安排：每周 6次；每次4小时   周一到周六下午1-5点，四小时\n教员要求：女老师 有辅导经验，有耐心，有责任心。\n老师薪水：6000/月'
  },
  {
    order_no: 'UU26061103',
    title: '暑期 高二女生数学辅导',
    subject: '数学',
    education_stage: '高中',
    grade_detail: '高二',
    district: '虹口区',
    address: '虹口区凉城新村街道（靠近上海大学延长校区）',
    teaching_type: '上门',
    salary_min: 160,
    salary_max: 160,
    requirements: '尽量女老师，有辅导过高三学生，有提分计划，调动孩子学习积极性，能够根据学生偏科原因针对性辅导，有经验有耐心。上海高考男老师也可以。暑期大概15次课程左右，一次2小时。',
    source: '微信接单',
    raw_content: '【家教编号】：UU26061103\n【学员地址】：虹口区凉城新村街道（靠近上海大学延长校区）\n【辅导科目】：数学\n【学员情况】：高二女生，数学比较薄弱\n【时间安排】：暑期大概15次课程左右，一次2小时\n【教员要求】：尽量女老师，有辅导过高三学生，有提分计划，调动孩子学习积极性，能够根据学生偏科原因针对性辅导，有经验有耐心。#上海高考男老师也可以\n【课酬待遇】：#160/小时'
  },
  {
    order_no: 'UU26060901',
    title: '暑期单 高二女生英语辅导',
    subject: '英语',
    education_stage: '高中',
    grade_detail: '高二',
    district: '闵行区',
    address: '闵行区浦江滨浦五村',
    teaching_type: '上门',
    salary_min: 150,
    salary_max: 170,
    requirements: '英语好的研究生女老师，有经验有耐心，认真负责。熟悉上海高考。暑期大概15-20次，一次2小时，具体时间可协商。英语100多分左右，阅读跟听力较差。',
    source: '微信接单',
    raw_content: '【家教编号】：UU26060901#暑期单\n【学员地址】：闵行区浦江滨浦五村\n【辅导科目】：英语\n【学员情况】：高二女生，英语100多分左右，阅读跟听力较差\n【时间安排】：暑期大概15-20次，一次2小时，具体时间可协商\n【教员要求】：#英语好的研究生女老师，有经验有耐心，认真负责。#熟悉上海高考\n【课酬待遇】：#150-170/小时'
  }
];

async function login() {
  const response = await fetch(`${BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: ADMIN_PASSWORD })
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(`登录失败: ${data.error}`);
  }
  console.log('✓ 管理员登录成功');
  return data.token;
}

async function createOrder(token, orderData) {
  const response = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(orderData)
  });
  const data = await response.json();
  return data;
}

async function publishOrder(token, orderId) {
  const response = await fetch(`${BASE_URL}/orders/${orderId}/publish`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data;
}

async function archiveOrder(token, orderId) {
  const response = await fetch(`${BASE_URL}/orders/${orderId}/archive`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data;
}

async function reactivateOrder(token, orderId) {
  const response = await fetch(`${BASE_URL}/orders/${orderId}/reactivate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();
  return data;
}

async function getAdminOrders(token, status = null) {
  const url = status
    ? `${BASE_URL}/admin/orders?status=${status}`
    : `${BASE_URL}/admin/orders`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  return data;
}

async function runTests() {
  console.log('========================================');
  console.log('  家教订单功能完整测试');
  console.log('========================================\n');

  let token;
  const createdOrders = [];

  try {
    token = await login();
  } catch (e) {
    console.error('✗ 登录失败:', e.message);
    return;
  }

  console.log('\n--- 阶段1: 批量创建订单（草稿状态）---');
  let createSuccess = 0;
  let createFail = 0;

  for (let i = 0; i < testOrders.length; i++) {
    const order = testOrders[i];
    try {
      const result = await createOrder(token, order);
      if (result.success) {
        createdOrders.push(result.order);
        createSuccess++;
        console.log(`  ✓ [${i + 1}/${testOrders.length}] 创建成功: ${order.order_no} - ${order.title}`);
      } else {
        createFail++;
        console.log(`  ✗ [${i + 1}/${testOrders.length}] 创建失败: ${order.order_no} - ${result.error}`);
      }
    } catch (e) {
      createFail++;
      console.log(`  ✗ [${i + 1}/${testOrders.length}] 创建异常: ${order.order_no} - ${e.message}`);
    }
  }

  console.log(`\n  结果: 成功 ${createSuccess} 个, 失败 ${createFail} 个`);

  if (createdOrders.length === 0) {
    console.log('\n✗ 没有成功创建的订单，无法继续测试');
    return;
  }

  console.log('\n--- 阶段2: 发布订单（草稿 → 在售）---');
  let publishSuccess = 0;
  let publishFail = 0;
  const publishedOrders = [];

  const ordersToPublish = createdOrders.slice(0, Math.min(10, createdOrders.length));
  for (let i = 0; i < ordersToPublish.length; i++) {
    const order = ordersToPublish[i];
    try {
      const result = await publishOrder(token, order.id);
      if (result.success) {
        publishedOrders.push(result.order);
        publishSuccess++;
        console.log(`  ✓ [${i + 1}/${ordersToPublish.length}] 发布成功: ${order.order_no}`);
      } else {
        publishFail++;
        console.log(`  ✗ [${i + 1}/${ordersToPublish.length}] 发布失败: ${order.order_no} - ${result.error}`);
      }
    } catch (e) {
      publishFail++;
      console.log(`  ✗ [${i + 1}/${ordersToPublish.length}] 发布异常: ${order.order_no} - ${e.message}`);
    }
  }

  console.log(`\n  结果: 成功 ${publishSuccess} 个, 失败 ${publishFail} 个`);

  console.log('\n--- 阶段3: 下架订单（在售 → 归档）---');
  let archiveSuccess = 0;
  let archiveFail = 0;
  const archivedOrders = [];

  const ordersToArchive = publishedOrders.slice(0, Math.min(5, publishedOrders.length));
  for (let i = 0; i < ordersToArchive.length; i++) {
    const order = ordersToArchive[i];
    try {
      const result = await archiveOrder(token, order.id);
      if (result.success) {
        archivedOrders.push(result.order);
        archiveSuccess++;
        console.log(`  ✓ [${i + 1}/${ordersToArchive.length}] 下架归档成功: ${order.order_no}`);
      } else {
        archiveFail++;
        console.log(`  ✗ [${i + 1}/${ordersToArchive.length}] 下架归档失败: ${order.order_no} - ${result.error}`);
      }
    } catch (e) {
      archiveFail++;
      console.log(`  ✗ [${i + 1}/${ordersToArchive.length}] 下架归档异常: ${order.order_no} - ${e.message}`);
    }
  }

  console.log(`\n  结果: 成功 ${archiveSuccess} 个, 失败 ${archiveFail} 个`);

  console.log('\n--- 阶段4: 重新上架订单（归档 → 在售）---');
  let reactivateSuccess = 0;
  let reactivateFail = 0;
  const reactivatedOrders = [];

  const ordersToReactivate = archivedOrders.slice(0, Math.min(3, archivedOrders.length));
  for (let i = 0; i < ordersToReactivate.length; i++) {
    const order = ordersToReactivate[i];
    try {
      const result = await reactivateOrder(token, order.id);
      if (result.success) {
        reactivatedOrders.push(result.order);
        reactivateSuccess++;
        console.log(`  ✓ [${i + 1}/${ordersToReactivate.length}] 重新上架成功: ${order.order_no}`);
      } else {
        reactivateFail++;
        console.log(`  ✗ [${i + 1}/${ordersToReactivate.length}] 重新上架失败: ${order.order_no} - ${result.error}`);
      }
    } catch (e) {
      reactivateFail++;
      console.log(`  ✗ [${i + 1}/${ordersToReactivate.length}] 重新上架异常: ${order.order_no} - ${e.message}`);
    }
  }

  console.log(`\n  结果: 成功 ${reactivateSuccess} 个, 失败 ${reactivateFail} 个`);

  console.log('\n--- 阶段5: 统计验证 ---');
  
  const allOrders = await getAdminOrders(token);
  const draftOrders = await getAdminOrders(token, 'draft');
  const activeOrders = await getAdminOrders(token, 'active');
  const closedOrders = await getAdminOrders(token, 'closed');

  console.log(`  全部订单: ${allOrders.count} 个`);
  console.log(`  草稿状态: ${draftOrders.count} 个`);
  console.log(`  在售状态: ${activeOrders.count} 个`);
  console.log(`  归档状态: ${closedOrders.count} 个`);

  console.log('\n========================================');
  console.log('  测试总结');
  console.log('========================================');
  console.log(`  创建订单: ${createSuccess}/${testOrders.length} 成功`);
  console.log(`  发布订单: ${publishSuccess}/${ordersToPublish.length} 成功`);
  console.log(`  下架归档: ${archiveSuccess}/${ordersToArchive.length} 成功`);
  console.log(`  重新上架: ${reactivateSuccess}/${ordersToReactivate.length} 成功`);
  
  const allPassed = createFail === 0 && publishFail === 0 && archiveFail === 0 && reactivateFail === 0;
  console.log(`\n  总体结果: ${allPassed ? '✓ 全部通过' : '✗ 存在失败'}`);
  console.log('========================================\n');
}

runTests().catch(console.error);
