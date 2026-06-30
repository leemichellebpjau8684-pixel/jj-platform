const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const ordersController = require('../controllers/ordersController');
const authMiddleware = require('../middleware/auth');
const { getStore, geocodeAddress } = require('../db/adapter');

router.post('/login', adminController.login);
router.get('/verify', authMiddleware, adminController.verify);
router.get('/orders', authMiddleware, ordersController.getAdminOrders);
router.post('/password', authMiddleware, adminController.updatePassword);

router.post('/orders/geocode', authMiddleware, async (req, res) => {
  try {
    const store = getStore();
    const orders = await store.orders.getAll();
    
    let successCount = 0;
    let failCount = 0;
    
    for (const order of orders) {
      if (!order.latitude || !order.longitude || order.geo_status === 'pending') {
        const result = await geocodeAddress(order.address, order.district);
        
        if (result) {
          await store.orders.update(order.id, {
            latitude: result.lat,
            longitude: result.lng,
            geo_status: 'completed'
          });
          successCount++;
        } else {
          failCount++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    res.json({
      success: true,
      message: `批量地理编码完成：成功 ${successCount} 条，失败 ${failCount} 条`
    });
  } catch (err) {
    console.error('批量地理编码失败:', err.message);
    res.status(500).json({
      success: false,
      error: '批量地理编码失败'
    });
  }
});

module.exports = router;