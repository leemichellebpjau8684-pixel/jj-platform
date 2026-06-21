const { getStore } = require('../db/adapter');

const VALID_EDUCATION_STAGES = ['幼儿', '小学', '初中', '高中', '大学', '成人'];
const VALID_TEACHING_TYPES = ['上门', '网课', '均可'];
const VALID_CONTACT_STATUSES = ['new', 'contacted', 'completed', 'expired'];
const MAX_PAGE_LIMIT = 100;

async function getOrders(req, res) {
  try {
    const store = getStore();
    const orders = await store.orders.getActive();
    
    res.json({
      success: true,
      count: orders.length,
      orders: orders
    });
  } catch (err) {
    console.error('查询订单失败:', err.message);
    res.status(500).json({
      success: false,
      error: '查询订单失败'
    });
  }
}

async function getAdminOrders(req, res) {
  try {
    const store = getStore();
    const status = req.query.status || null;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(req.query.limit) || 50));
    const offset = (page - 1) * limit;
    
    let orders = await store.orders.getAll();
    
    if (status) {
      orders = orders.filter(o => o.status === status);
    }
    
    const totalCount = orders.length;
    const paginatedOrders = orders.slice(offset, offset + limit);
    
    res.json({
      success: true,
      count: totalCount,
      orders: paginatedOrders
    });
  } catch (err) {
    console.error('查询管理员订单失败:', err.message);
    res.status(500).json({
      success: false,
      error: '查询管理员订单失败'
    });
  }
}

async function getOrderById(req, res) {
  try {
    const store = getStore();
    const { id } = req.params;
    
    const order = await store.orders.getById(id);
    
    if (!order || order.status !== 'active') {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }
    
    await store.orders.incrementView(id);
    
    res.json({
      success: true,
      order: order
    });
  } catch (err) {
    console.error('查询订单详情失败:', err.message);
    res.status(500).json({
      success: false,
      error: '查询订单详情失败'
    });
  }
}

function validateOrderData(data, isUpdate = false) {
  const errors = [];
  
  if (!isUpdate) {
    if (!data.title || data.title.trim().length === 0) {
      errors.push('标题不能为空');
    }
    if (!data.subject || data.subject.trim().length === 0) {
      errors.push('科目不能为空');
    }
    if (!data.education_stage || data.education_stage.trim().length === 0) {
      errors.push('学段不能为空');
    }
    if (!data.district || data.district.trim().length === 0) {
      errors.push('区域不能为空');
    }
    if (!data.address || data.address.trim().length === 0) {
      errors.push('地址不能为空');
    }
    if (!data.teaching_type || data.teaching_type.trim().length === 0) {
      errors.push('教学类型不能为空');
    }
    if (!data.source || data.source.trim().length === 0) {
      errors.push('来源不能为空');
    }
  }
  
  if (data.education_stage && !VALID_EDUCATION_STAGES.includes(data.education_stage)) {
    errors.push(`学段必须是：${VALID_EDUCATION_STAGES.join('、')}`);
  }
  
  if (data.teaching_type && !VALID_TEACHING_TYPES.includes(data.teaching_type)) {
    errors.push(`教学类型必须是：${VALID_TEACHING_TYPES.join('、')}`);
  }
  
  if (data.salary_min !== undefined && data.salary_min !== null && data.salary_min < 0) {
    errors.push('最低薪资不能为负数');
  }
  
  if (data.salary_max !== undefined && data.salary_max !== null && data.salary_max < 0) {
    errors.push('最高薪资不能为负数');
  }
  
  if (data.salary_min !== undefined && data.salary_max !== undefined &&
      data.salary_min !== null && data.salary_max !== null &&
      data.salary_min > data.salary_max) {
    errors.push('最低薪资不能大于最高薪资');
  }
  
  if (data.contact_fee !== undefined && data.contact_fee !== null && data.contact_fee < 0) {
    errors.push('中介费不能为负数');
  }
  
  if (data.contact_status && !VALID_CONTACT_STATUSES.includes(data.contact_status)) {
    errors.push(`联系状态必须是：${VALID_CONTACT_STATUSES.join('、')}`);
  }
  
  return errors;
}

// 教育阶段映射：将非标准值映射到标准值
function normalizeEducationStage(stage) {
  if (!stage) return stage;
  const stageMap = {
    '其他': '幼儿',
    '学前': '幼儿',
    '幼儿园': '幼儿',
    '幼教': '幼儿',
    '一年级': '小学',
    '二年级': '小学',
    '三年级': '小学',
    '四年级': '小学',
    '五年级': '小学',
    '六年级': '小学',
    '初一': '初中',
    '初二': '初中',
    '初三': '初中',
    '高一': '高中',
    '高二': '高中',
    '高三': '高中',
    '大一': '大学',
    '大二': '大学',
    '大三': '大学',
    '大四': '大学',
  };
  if (VALID_EDUCATION_STAGES.includes(stage)) {
    return stage;
  }
  return stageMap[stage] || stage; // 返回原始值，让校验捕获
}

// 教学类型映射
function normalizeTeachingType(type) {
  if (!type) return type;
  const typeMap = {
    '线上': '网课',
    '网络': '网课',
    '上门家教': '上门',
    '家教': '上门',
    '都可以': '均可',
    '都行': '均可',
  };
  if (VALID_TEACHING_TYPES.includes(type)) {
    return type;
  }
  return typeMap[type] || type;
}

async function createOrder(req, res) {
  try {
    // 数据标准化
    if (req.body.education_stage) {
      req.body.education_stage = normalizeEducationStage(req.body.education_stage);
    }
    if (req.body.teaching_type) {
      req.body.teaching_type = normalizeTeachingType(req.body.teaching_type);
    }
    
    const errors = validateOrderData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: errors.join('；')  // 将错误数组合并为字符串
      });
    }
    
    const store = getStore();
    
    const {
      title, subject, education_stage, grade_detail,
      salary_min, salary_max, contact_fee,
      district, address, latitude, longitude,
      teaching_type, requirements, source, raw_content,
      order_no
    } = req.body;
    
    const newOrder = await store.orders.create({
      title, subject, education_stage, grade_detail,
      salary_min, salary_max, contact_fee,
      district, address, latitude, longitude,
      teaching_type, requirements, source, raw_content,
      order_no
    });
    
    res.status(201).json({
      success: true,
      order: newOrder
    });
  } catch (err) {
    console.error('创建订单失败:', err.message);
    console.error('错误堆栈:', err.stack);
    console.error('请求数据:', JSON.stringify(req.body));
    res.status(500).json({
      success: false,
      error: '创建订单失败',
      details: err.message,
      timestamp: new Date().toISOString()
    });
  }
}

async function updateOrder(req, res) {
  try {
    // 数据标准化
    if (req.body.education_stage) {
      req.body.education_stage = normalizeEducationStage(req.body.education_stage);
    }
    if (req.body.teaching_type) {
      req.body.teaching_type = normalizeTeachingType(req.body.teaching_type);
    }
    
    const store = getStore();
    const { id } = req.params;
    
    const order = await store.orders.getById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }
    
    const errors = validateOrderData(req.body, true);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    const {
      title, subject, education_stage, grade_detail,
      salary_min, salary_max, contact_fee,
      district, address, latitude, longitude,
      teaching_type, requirements, source, raw_content,
      contact_status
    } = req.body;
    
    const updatedOrder = await store.orders.update(id, {
      title, subject, education_stage, grade_detail,
      salary_min, salary_max, contact_fee,
      district, address, latitude, longitude,
      teaching_type, requirements, source, raw_content,
      contact_status
    });
    
    res.json({
      success: true,
      order: updatedOrder
    });
  } catch (err) {
    console.error('更新订单失败:', err.message);
    res.status(500).json({
      success: false,
      error: '更新订单失败'
    });
  }
}

async function deleteOrder(req, res) {
  try {
    const store = getStore();
    const { id } = req.params;
    
    const order = await store.orders.getById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }
    
    await store.orders.delete(id);
    
    res.json({
      success: true,
      message: '订单已归档'
    });
  } catch (err) {
    console.error('删除订单失败:', err.message);
    res.status(500).json({
      success: false,
      error: '删除订单失败'
    });
  }
}

async function publishOrder(req, res) {
  try {
    const store = getStore();
    const { id } = req.params;
    
    const order = await store.orders.getById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }
    
    if (order.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: '只有草稿状态的订单可以发布'
      });
    }
    
    const publishedOrder = await store.orders.publish(id);
    
    res.json({
      success: true,
      order: publishedOrder
    });
  } catch (err) {
    console.error('发布订单失败:', err.message);
    res.status(500).json({
      success: false,
      error: '发布订单失败'
    });
  }
}

async function archiveOrder(req, res) {
  try {
    const store = getStore();
    const { id } = req.params;
    
    const order = await store.orders.getById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }
    
    if (order.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: '只有已发布状态的订单可以归档'
      });
    }
    
    const archivedOrder = await store.orders.archive(id);
    
    res.json({
      success: true,
      order: archivedOrder
    });
  } catch (err) {
    console.error('归档订单失败:', err.message);
    res.status(500).json({
      success: false,
      error: '归档订单失败'
    });
  }
}

async function reactivateOrder(req, res) {
  try {
    const store = getStore();
    const { id } = req.params;
    
    const order = await store.orders.getById(id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: '订单不存在'
      });
    }
    
    if (order.status !== 'closed') {
      return res.status(400).json({
        success: false,
        error: '只有归档状态的订单可以重新上架'
      });
    }
    
    const reactivatedOrder = await store.orders.reactivate(id);
    
    res.json({
      success: true,
      order: reactivatedOrder
    });
  } catch (err) {
    console.error('重新上架订单失败:', err.message);
    res.status(500).json({
      success: false,
      error: '重新上架订单失败'
    });
  }
}

module.exports = {
  getOrders,
  getAdminOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  publishOrder,
  archiveOrder,
  reactivateOrder
};