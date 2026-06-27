const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

router.post('/pageview', analyticsController.recordPageView);
router.post('/order-view', analyticsController.recordOrderView);
router.get('/summary', analyticsController.getSummary);
router.get('/daily-trend', analyticsController.getDailyTrend);
router.get('/device-stats', analyticsController.getDeviceStats);
router.get('/page-source-stats', analyticsController.getPageSourceStats);
router.get('/top-orders', analyticsController.getTopOrders);
router.get('/order-view-stats/:order_id', analyticsController.getOrderViewStats);
router.get('/all-order-view-stats', analyticsController.getAllOrderViewStats);

module.exports = router;