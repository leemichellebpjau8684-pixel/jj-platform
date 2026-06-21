const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function test() {
  console.log('=== API测试 ===\n');
  
  const token = await login();
  if (!token) return;
  
  await testGetOrders();
  await testCreateOrder(token);
  await testAdminOrders(token);
  
  console.log('\n=== 测试完成 ===');
}

async function login() {
  try {
    const response = await fetch('http://localhost:3001/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: ADMIN_PASSWORD })
    });
    const data = await response.json();
    console.log('1. 管理员登录:', data.success ? '成功' : '失败');
    return data.token;
  } catch (e) {
    console.log('1. 管理员登录失败:', e.message);
    return null;
  }
}

async function testGetOrders() {
  try {
    const response = await fetch('http://localhost:3001/api/orders');
    const data = await response.json();
    console.log(`2. 获取订单列表: 成功, 共 ${data.count} 个在售订单`);
  } catch (e) {
    console.log('2. 获取订单列表失败:', e.message);
  }
}

async function testCreateOrder(token) {
  try {
    const response = await fetch('http://localhost:3001/api/orders', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: '测试订单',
        subject: '数学',
        education_stage: '初中',
        district: '闵行区',
        address: '东川路800号',
        teaching_type: '上门',
        source: '测试'
      })
    });
    const data = await response.json();
    console.log('3. 创建订单:', data.success ? `成功, ID: ${data.order.id}` : `失败: ${data.errors?.join(', ') || data.error}`);
  } catch (e) {
    console.log('3. 创建订单失败:', e.message);
  }
}

async function testAdminOrders(token) {
  try {
    const response = await fetch('http://localhost:3001/api/admin/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    console.log(`4. 管理员订单列表: 成功, 共 ${data.count} 个订单`);
  } catch (e) {
    console.log('4. 管理员订单列表失败:', e.message);
  }
}

test();