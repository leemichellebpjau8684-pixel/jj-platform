const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const BASE_URL = 'http://localhost:3001/api';

async function login() {
  const response = await fetch(`${BASE_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: ADMIN_PASSWORD })
  });
  const data = await response.json();
  if (!data.success) throw new Error(`登录失败: ${data.error}`);
  return data.token;
}

async function getStats(token) {
  const response = await fetch(`${BASE_URL}/analytics/summary`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
}

async function getTopOrders(token) {
  const response = await fetch(`${BASE_URL}/analytics/top-orders`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
}

async function recordPageView(visitorId, pagePath, pageTitle) {
  const response = await fetch(`${BASE_URL}/analytics/pageview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitor_id: visitorId, page_path: pagePath, page_title: pageTitle })
  });
  return await response.json();
}

async function recordOrderView(visitorId, orderId) {
  const response = await fetch(`${BASE_URL}/analytics/order-view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visitor_id: visitorId, order_id: orderId })
  });
  return await response.json();
}

async function getActiveOrders(token) {
  const response = await fetch(`${BASE_URL}/orders`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
}

async function archiveOrder(token, orderId) {
  const response = await fetch(`${BASE_URL}/orders/${orderId}/archive`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
}

async function runTests() {
  console.log('========================================');
  console.log('  统计页面功能测试');
  console.log('========================================\n');

  let token;
  try {
    token = await login();
    console.log('✓ 管理员登录成功');
  } catch (e) {
    console.error('✗ 登录失败:', e.message);
    return;
  }

  console.log('\n--- 阶段1: 检查当前存储类型 ---');
  const healthResponse = await fetch(`${BASE_URL}/health`);
  const healthData = await healthResponse.json();
  console.log(`  当前存储类型: ${healthData.database || '未知'}`);
  console.log(`  存储说明: ${healthData.database === 'postgresql' ? '✅ PostgreSQL数据库（数据持久化）' : '⚠️ 内存存储（重启后数据丢失）'}`);

  console.log('\n--- 阶段2: 获取初始统计数据 ---');
  const initialStats = await getStats(token);
  console.log(`  初始统计数据:`);
  console.log(`    累计 PV: ${initialStats.data.totalPV}`);
  console.log(`    累计 UV: ${initialStats.data.totalUV}`);
  console.log(`    今日 PV: ${initialStats.data.todayPV}`);
  console.log(`    今日 UV: ${initialStats.data.todayUV}`);

  console.log('\n--- 阶段3: 模拟页面浏览 ---');
  const visitorId = `test-${Date.now()}`;
  
  const pageViews = [
    { path: '/order/1', title: '订单详情页1' },
    { path: '/order/2', title: '订单详情页2' },
    { path: '/order/1', title: '订单详情页1' },
    { path: '/', title: '首页' },
    { path: '/order/1', title: '订单详情页1' },
  ];

  for (let i = 0; i < pageViews.length; i++) {
    const result = await recordPageView(visitorId, pageViews[i].path, pageViews[i].title);
    if (result.success) {
      console.log(`  ✓ [${i + 1}/${pageViews.length}] 记录页面浏览: ${pageViews[i].path}`);
    } else {
      console.log(`  ✗ [${i + 1}/${pageViews.length}] 记录失败: ${result.error}`);
    }
  }

  console.log('\n--- 阶段4: 验证统计数据是否更新 ---');
  const updatedStats = await getStats(token);
  const pvIncrease = updatedStats.data.totalPV - initialStats.data.totalPV;
  console.log(`  更新后统计数据:`);
  console.log(`    累计 PV: ${updatedStats.data.totalPV} (增加 ${pvIncrease})`);
  console.log(`    累计 UV: ${updatedStats.data.totalUV}`);
  console.log(`    今日 PV: ${updatedStats.data.todayPV}`);
  console.log(`    今日 UV: ${updatedStats.data.todayUV}`);

  console.log('\n--- 阶段5: 获取在售订单列表 ---');
  const activeOrders = await getActiveOrders(token);
  console.log(`  当前在售订单数: ${activeOrders.count}`);
  
  if (activeOrders.count > 0) {
    const sampleOrder = activeOrders.orders[0];
    console.log(`  第一个在售订单: ${sampleOrder.order_no} - ${sampleOrder.title}`);
    console.log(`  当前浏览次数: ${sampleOrder.view_count}`);

    console.log('\n--- 阶段6: 模拟订单浏览 ---');
    for (let i = 0; i < 5; i++) {
      const result = await recordOrderView(`visitor-${i}`, sampleOrder.id);
      if (result.success) {
        console.log(`  ✓ [${i + 1}/5] 记录订单浏览: ${sampleOrder.order_no}`);
      }
    }

    console.log('\n--- 阶段7: 获取热门订单列表 ---');
    const topOrdersBefore = await getTopOrders(token);
    console.log(`  热门订单数: ${topOrdersBefore.data.length}`);
    if (topOrdersBefore.data.length > 0) {
      console.log('  热门订单前3名:');
      topOrdersBefore.data.slice(0, 3).forEach((order, index) => {
        console.log(`    ${index + 1}. ${order.order_no} - ${order.title} (浏览${order.view_count}次)`);
      });
    }

    console.log('\n--- 阶段8: 下架订单并验证热门排序更新 ---');
    const orderToArchive = activeOrders.orders[0];
    console.log(`  准备下架订单: ${orderToArchive.order_no} - ${orderToArchive.title}`);
    
    const archiveResult = await archiveOrder(token, orderToArchive.id);
    if (archiveResult.success) {
      console.log('  ✓ 订单下架成功');
    } else {
      console.log('  ✗ 订单下架失败:', archiveResult.error);
    }

    console.log('\n--- 阶段9: 验证热门订单列表是否更新 ---');
    const topOrdersAfter = await getTopOrders(token);
    console.log(`  下架后热门订单数: ${topOrdersAfter.data.length}`);
    
    const archivedInList = topOrdersAfter.data.find(o => o.order_id === orderToArchive.id);
    if (archivedInList) {
      console.log('  ✗ 警告: 已下架订单仍在热门订单列表中');
    } else {
      console.log('  ✓ 已下架订单已从热门订单列表中移除');
    }

    if (topOrdersAfter.data.length > 0) {
      console.log('  更新后的热门订单前3名:');
      topOrdersAfter.data.slice(0, 3).forEach((order, index) => {
        console.log(`    ${index + 1}. ${order.order_no} - ${order.title} (浏览${order.view_count}次)`);
      });
    }
  } else {
    console.log('  ⚠️ 没有在售订单，跳过热门订单测试');
  }

  console.log('\n========================================');
  console.log('  测试总结');
  console.log('========================================');
  console.log(`  存储类型: ${healthData.database === 'postgresql' ? 'PostgreSQL (持久化)' : '内存存储 (临时)'}`);
  console.log(`  页面浏览记录: ${pageViews.length} 次`);
  console.log(`  PV增长: ${pvIncrease} 次`);
  console.log(`  热门订单排序更新: ${activeOrders.count > 0 ? '已测试' : '未测试'}`);
  console.log('========================================\n');
}

runTests().catch(console.error);
