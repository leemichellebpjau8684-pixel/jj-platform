const { getStore } = require('../db/adapter');

function getDeviceType(userAgent) {
  if (!userAgent) return 'unknown';
  if (/Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/.test(userAgent)) {
    return 'mobile';
  }
  return 'desktop';
}

exports.recordPageView = async (req, res) => {
  const { visitor_id, page_path, page_title, referrer } = req.body;
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip || req.connection?.remoteAddress || '';
  
  if (!visitor_id || !page_path) {
    return res.status(400).json({ success: false, error: '缺少必要参数' });
  }
  
  try {
    const store = getStore();
    const deviceType = getDeviceType(userAgent);
    
    if (store.analytics) {
      await Promise.all([
        store.analytics.upsertVisitor(visitor_id, deviceType, userAgent, ipAddress),
        store.analytics.recordPageView(visitor_id, page_path, page_title, referrer, deviceType, userAgent, ipAddress)
      ]);
    }
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('recordPageView error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.recordOrderView = async (req, res) => {
  const { visitor_id, order_id } = req.body;
  const userAgent = req.headers['user-agent'];
  const ipAddress = req.ip || req.connection?.remoteAddress || '';
  
  if (!visitor_id || !order_id) {
    return res.status(400).json({ success: false, error: '缺少必要参数' });
  }
  
  try {
    const store = getStore();
    const deviceType = getDeviceType(userAgent);
    
    if (store.analytics) {
      await Promise.all([
        store.analytics.upsertVisitor(visitor_id, deviceType, userAgent, ipAddress),
        store.analytics.recordOrderView(visitor_id, order_id)
      ]);
    }
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('recordOrderView error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getSummary = async (req, res) => {
  try {
    const store = getStore();
    if (!store.analytics) {
      return res.status(200).json({
        success: true,
        data: { totalPV: 0, totalUV: 0, todayPV: 0, todayUV: 0 }
      });
    }
    
    const data = await store.analytics.getSummary();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getSummary error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getDailyTrend = async (req, res) => {
  try {
    const store = getStore();
    if (!store.analytics) {
      const data = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        data.push({ date: d.toISOString().split('T')[0], pv: 0, uv: 0 });
      }
      return res.status(200).json({ success: true, data });
    }
    
    const data = await store.analytics.getDailyTrend();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getDailyTrend error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getDeviceStats = async (req, res) => {
  try {
    const store = getStore();
    if (!store.analytics) {
      return res.status(200).json({
        success: true,
        data: { desktop: 0, mobile: 0, unknown: 0 }
      });
    }
    
    const data = await store.analytics.getDeviceStats();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getDeviceStats error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getPageSourceStats = async (req, res) => {
  try {
    const store = getStore();
    if (!store.analytics) {
      return res.status(200).json({ success: true, data: [] });
    }
    
    const data = await store.analytics.getPageSourceStats();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getPageSourceStats error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getTopOrders = async (req, res) => {
  try {
    const store = getStore();
    if (!store.analytics) {
      return res.status(200).json({ success: true, data: [] });
    }
    
    const data = await store.analytics.getTopOrders();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getTopOrders error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getOrderViewStats = async (req, res) => {
  const { order_id } = req.params;
  
  try {
    const store = getStore();
    if (!store.analytics) {
      return res.status(200).json({
        success: true,
        data: { total_views: 0, today_views: 0, last_viewed_at: null }
      });
    }
    
    const data = await store.analytics.getOrderViewStats(order_id);
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getOrderViewStats error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getAllOrderViewStats = async (req, res) => {
  try {
    const store = getStore();
    if (!store.analytics) {
      return res.status(200).json({ success: true, data: {} });
    }
    
    const data = await store.analytics.getAllOrderViewStats();
    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('getAllOrderViewStats error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};
