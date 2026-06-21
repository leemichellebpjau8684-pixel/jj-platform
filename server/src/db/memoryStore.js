let orders = [
  {
    id: 'mem-001',
    order_no: 'ORD2026061800001',
    title: '初二数学辅导',
    subject: '数学',
    education_stage: '初中',
    grade_detail: '初二',
    salary_min: 100,
    salary_max: 120,
    contact_fee: 50,
    district: '静安区',
    address: '江宁路418弄小区',
    latitude: 31.2484,
    longitude: 121.4421,
    teaching_type: '上门',
    requirements: '男女教员均可，要求数学专业，有初中辅导经验优先。',
    source: '微信解析',
    raw_content: '学员地址：静安区江宁路418弄小区\n学员情况：初二男生，数学基础薄弱。\n时间安排：每周2次，每次2小时\n教员要求：男女教员均可，要求数学专业。\n老师薪水：100-120元/小时',
    status: 'active',
    contact_status: 'new',
    view_count: 15,
    geo_status: 'success',
    published_at: new Date().toISOString(),
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mem-002',
    order_no: 'ORD2026061800002',
    title: '高一英语家教',
    subject: '英语',
    education_stage: '高中',
    grade_detail: '高一',
    salary_min: 130,
    salary_max: 150,
    contact_fee: 60,
    district: '浦东新区',
    address: '陆家嘴环路1000号',
    latitude: 31.2397,
    longitude: 121.5090,
    teaching_type: '网课',
    requirements: '女教员优先，英语专业，发音标准。',
    source: '微信解析',
    raw_content: '学员地址：浦东新区陆家嘴环路1000号\n学员情况：高一女生，英语成绩中等。\n时间安排：每周3次，每次1.5小时\n教员要求：女教员优先。\n老师薪水：130-150元/小时',
    status: 'active',
    contact_status: 'contacted',
    view_count: 8,
    geo_status: 'success',
    published_at: new Date().toISOString(),
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mem-003',
    order_no: 'ORD2026061800003',
    title: '小学五年级语文',
    subject: '语文',
    education_stage: '小学',
    grade_detail: '五年级',
    salary_min: 80,
    salary_max: 100,
    contact_fee: 40,
    district: '徐汇区',
    address: '淮海中路1200号',
    latitude: 31.2163,
    longitude: 121.4492,
    teaching_type: '上门',
    requirements: '有耐心，善于引导小学生。',
    source: '微信解析',
    raw_content: '学员地址：徐汇区淮海中路1200号\n学员情况：小学五年级女生。\n时间安排：每周2次，每次1.5小时\n教员要求：有耐心。\n老师薪水：80-100元/小时',
    status: 'active',
    contact_status: 'completed',
    view_count: 22,
    geo_status: 'success',
    published_at: new Date().toISOString(),
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mem-004',
    order_no: 'ORD2026061800004',
    title: '初三物理冲刺',
    subject: '物理',
    education_stage: '初中',
    grade_detail: '初三',
    salary_min: 120,
    salary_max: 140,
    contact_fee: 50,
    district: '杨浦区',
    address: '邯郸路220号',
    latitude: 31.2878,
    longitude: 121.5151,
    teaching_type: '均可',
    requirements: '物理专业，有中考辅导经验。',
    source: '微信解析',
    raw_content: '学员地址：杨浦区邯郸路220号\n学员情况：初三男生，物理成绩需提升。\n时间安排：每周3次，每次2小时\n教员要求：物理专业。\n老师薪水：120-140元/小时',
    status: 'draft',
    contact_status: 'new',
    view_count: 0,
    geo_status: 'pending',
    published_at: null,
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'mem-005',
    order_no: 'ORD2026061800005',
    title: '成人英语培训',
    subject: '英语',
    education_stage: '成人',
    grade_detail: null,
    salary_min: 150,
    salary_max: 200,
    contact_fee: 80,
    district: '黄浦区',
    address: '南京东路100号',
    latitude: 31.2397,
    longitude: 121.4998,
    teaching_type: '网课',
    requirements: '英语口语流利，有商务英语经验。',
    source: '微信解析',
    raw_content: '学员地址：黄浦区南京东路100号\n学员情况：成人，商务英语需求。\n时间安排：每周2次，每次1小时\n教员要求：英语口语流利。\n老师薪水：150-200元/小时',
    status: 'active',
    contact_status: 'expired',
    view_count: 5,
    geo_status: 'success',
    published_at: new Date().toISOString(),
    archived_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

let admins = [
  {
    id: 'admin-001',
    username: 'admin',
    password_hash: '$2b$10$hiOM5sPh0CvoFjX85q5aZeWWZr1fgLqqOGeHzv7j3Rwc0b.qOdoP6',
    nickname: '管理员',
    last_login_at: null,
    created_at: new Date().toISOString()
  }
];

let orderSeq = 6;

function generateOrderNo() {
  const seqVal = orderSeq++;
  return 'ORD' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + String(seqVal).padStart(6, '0');
}

function generateId() {
  return 'mem-' + String(Math.random()).slice(2, 8);
}

const memoryStore = {
  orders: {
    getAll: () => orders,
    getActive: () => orders.filter(o => o.status === 'active'),
    getById: (id) => orders.find(o => o.id === id),
    create: (data) => {
      const newOrder = {
        id: generateId(),
        order_no: (data.order_no === undefined || data.order_no === null) ? generateOrderNo() : data.order_no,
        status: 'draft',
        contact_status: 'new',
        view_count: 0,
        geo_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: null,
        archived_at: null,
        ...data
      };
      orders.unshift(newOrder);
      return newOrder;
    },
    update: (id, data) => {
      const index = orders.findIndex(o => o.id === id);
      if (index === -1) return null;
      orders[index] = { ...orders[index], ...data, updated_at: new Date().toISOString() };
      return orders[index];
    },
    delete: (id) => {
      const index = orders.findIndex(o => o.id === id);
      if (index === -1) return null;
      orders[index] = { ...orders[index], status: 'closed', archived_at: new Date().toISOString() };
      return orders[index];
    },
    publish: (id) => {
      const index = orders.findIndex(o => o.id === id);
      if (index === -1) return null;
      orders[index] = { 
        ...orders[index], 
        status: 'active', 
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return orders[index];
    },
    archive: (id) => {
      const index = orders.findIndex(o => o.id === id);
      if (index === -1) return null;
      orders[index] = { 
        ...orders[index], 
        status: 'closed', 
        archived_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      return orders[index];
    },
    incrementView: (id) => {
      const index = orders.findIndex(o => o.id === id);
      if (index === -1) return;
      orders[index].view_count++;
    },
    count: (status = null) => {
      if (status) return orders.filter(o => o.status === status).length;
      return orders.length;
    }
  },
  admins: {
    getByUsername: (username) => admins.find(a => a.username === username),
    updateLastLogin: (id) => {
      const index = admins.findIndex(a => a.id === id);
      if (index === -1) return;
      admins[index].last_login_at = new Date().toISOString();
    }
  }
};

module.exports = memoryStore;