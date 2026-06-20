const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const ordersController = require('../controllers/ordersController');
const authMiddleware = require('../middleware/auth');

router.post('/login', adminController.login);
router.get('/verify', authMiddleware, adminController.verify);
router.get('/orders', authMiddleware, ordersController.getAdminOrders);

module.exports = router;