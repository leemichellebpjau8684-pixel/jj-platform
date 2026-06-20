const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const authMiddleware = require('../middleware/auth');

router.get('/', ordersController.getOrders);
router.get('/:id', ordersController.getOrderById);

router.post('/', authMiddleware, ordersController.createOrder);
router.put('/:id', authMiddleware, ordersController.updateOrder);
router.delete('/:id', authMiddleware, ordersController.deleteOrder);
router.post('/:id/publish', authMiddleware, ordersController.publishOrder);
router.post('/:id/archive', authMiddleware, ordersController.archiveOrder);

module.exports = router;