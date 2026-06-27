const { pool } = require('../db/adapter');

function getDeviceType(userAgent) {
  if (!userAgent) return 'unknown';
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

async function upsertVisitor(visitorId, userAgent, ipAddress) {
  const deviceType = getDeviceType(userAgent);
  const now = new Date().toISOString();
  
  try {
    await pool.query(`
      INSERT INTO analytics_visitors (visitor_id, first_visit_at, last_visit_at, device_type, user_agent, ip_address)
      VALUES ($1, $2, $2, $3, $4, $5)
      ON CONFLICT (visitor_id) DO UPDATE SET
        last_visit_at = $2,
        device_type = COALESCE(EXCLUDED.device_type, analytics_visitors.device_type),
        user_agent = COALESCE(EXCLUDED.user_agent, analytics_visitors.user_agent),
        ip_address = COALESCE(EXCLUDED.ip_address, analytics_visitors.ip_address)
    `, [visitorId, now, deviceType, userAgent, ipAddress]);
  } catch (err) {
    console.error('upsertVisitor error:', err.message);
  }
}

async function logPageView(visitorId, pagePath, pageTitle, referrer, userAgent, ipAddress) {
  const deviceType = getDeviceType(userAgent);
  
  try {
    await pool.query(`
      INSERT INTO analytics_page_views (visitor_id, page_path, page_title, referrer, device_type, user_agent, ip_address)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [visitorId, pagePath, pageTitle, referrer, deviceType, userAgent, ipAddress]);
  } catch (err) {
    console.error('logPageView error:', err.message);
  }
}

async function logOrderView(visitorId, orderId) {
  try {
    await pool.query(`
      INSERT INTO order_view_logs (visitor_id, order_id)
      VALUES ($1, $2)
    `, [visitorId, orderId]);
  } catch (err) {
    console.error('logOrderView error:', err.message);
  }
}

exports.recordPageView = async (req, res) => {
  const { visitor_id, page_path, page_title, referrer } = req.body;
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip || req.connection?.remoteAddress || '';
  
  if (!visitor_id || !page_path) {
    return res.status(400).json({ success: false, error: '缺少必要参数' });
  }
  
  await Promise.all([
    upsertVisitor(visitor_id, userAgent, ipAddress),
    logPageView(visitor_id, page_path, page_title, referrer, userAgent, ipAddress)
  ]);
  
  res.status(200).json({ success: true });
};

exports.recordOrderView = async (req, res) => {
  const { visitor_id, order_id } = req.body;
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip || req.connection?.remoteAddress || '';
  
  if (!visitor_id || !order_id) {
    return res.status(400).json({ success: false, error: '缺少必要参数' });
  }
  
  await Promise.all([
    upsertVisitor(visitor_id, userAgent, ipAddress),
    logOrderView(visitor_id, order_id)
  ]);
  
  res.status(200).json({ success: true });
};

exports.getSummary = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    const [totalPVResult, totalUVResult, todayPVResult, todayUVResult] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM analytics_page_views'),
      pool.query('SELECT COUNT(*) as count FROM analytics_visitors'),
      pool.query(`SELECT COUNT(*) as count FROM analytics_page_views WHERE created_at >= $1`, [todayStart]),
      pool.query(`SELECT COUNT(DISTINCT visitor_id) as count FROM analytics_page_views WHERE created_at >= $1`, [todayStart])
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalPV: parseInt(totalPVResult.rows[0].count) || 0,
        totalUV: parseInt(totalUVResult.rows[0].count) || 0,
        todayPV: parseInt(todayPVResult.rows[0].count) || 0,
        todayUV: parseInt(todayUVResult.rows[0].count) || 0
      }
    });
  } catch (err) {
    console.error('getSummary error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getDailyTrend = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as pv,
        COUNT(DISTINCT visitor_id) as uv
      FROM analytics_page_views
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date
    `);
    
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }
    
    const data = last7Days.map(date => {
      const row = result.rows.find(r => r.date === date);
      return {
        date,
        pv: row ? parseInt(row.pv) : 0,
        uv: row ? parseInt(row.uv) : 0
      };
    });
    
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getDailyTrend error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getDeviceStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        device_type,
        COUNT(*) as count
      FROM analytics_page_views
      GROUP BY device_type
    `);
    
    const stats = { desktop: 0, mobile: 0, unknown: 0 };
    result.rows.forEach(row => {
      const type = row.device_type || 'unknown';
      stats[type] = parseInt(row.count);
    });
    
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    console.error('getDeviceStats error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getPageSourceStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        page_path,
        COUNT(*) as count
      FROM analytics_page_views
      GROUP BY page_path
      ORDER BY count DESC
      LIMIT 20
    `);
    
    const stats = result.rows.map(row => ({
      page: row.page_path,
      count: parseInt(row.count)
    }));
    
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    console.error('getPageSourceStats error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getTopOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ov.order_id,
        o.order_no,
        o.title,
        o.subject,
        o.education_stage,
        o.district,
        COUNT(*) as view_count,
        MAX(ov.viewed_at) as last_viewed_at
      FROM order_view_logs ov
      JOIN orders o ON ov.order_id = o.id
      WHERE o.status = 'active'
      GROUP BY ov.order_id, o.order_no, o.title, o.subject, o.education_stage, o.district
      ORDER BY view_count DESC
      LIMIT 20
    `);
    
    const topOrders = result.rows.map(row => ({
      order_id: row.order_id,
      order_no: row.order_no,
      title: row.title,
      subject: row.subject,
      education_stage: row.education_stage,
      district: row.district,
      view_count: parseInt(row.view_count),
      last_viewed_at: row.last_viewed_at ? row.last_viewed_at.toISOString() : null
    }));
    
    res.status(200).json({ success: true, data: topOrders });
  } catch (err) {
    console.error('getTopOrders error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getOrderViewStats = async (req, res) => {
  const { order_id } = req.params;
  
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    const [totalResult, todayResult, lastViewResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) as count FROM order_view_logs WHERE order_id = $1`, [order_id]),
      pool.query(`SELECT COUNT(*) as count FROM order_view_logs WHERE order_id = $1 AND viewed_at >= $2`, [order_id, todayStart]),
      pool.query(`SELECT MAX(viewed_at) as last_viewed FROM order_view_logs WHERE order_id = $1`, [order_id])
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        total_views: parseInt(totalResult.rows[0].count) || 0,
        today_views: parseInt(todayResult.rows[0].count) || 0,
        last_viewed_at: lastViewResult.rows[0].last_viewed ? lastViewResult.rows[0].last_viewed.toISOString() : null
      }
    });
  } catch (err) {
    console.error('getOrderViewStats error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllOrderViewStats = async (req, res) => {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    
    const result = await pool.query(`
      SELECT 
        ov.order_id,
        COUNT(*) as total_views,
        SUM(CASE WHEN ov.viewed_at >= $1 THEN 1 ELSE 0 END) as today_views,
        MAX(ov.viewed_at) as last_viewed_at
      FROM order_view_logs ov
      GROUP BY ov.order_id
    `, [todayStart]);
    
    const stats = {};
    result.rows.forEach(row => {
      stats[row.order_id] = {
        total_views: parseInt(row.total_views) || 0,
        today_views: parseInt(row.today_views) || 0,
        last_viewed_at: row.last_viewed_at ? row.last_viewed_at.toISOString() : null
      };
    });
    
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    console.error('getAllOrderViewStats error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};