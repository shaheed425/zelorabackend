const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrderByNumber,
  getOrders,
  updateOrderStatus,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.post('/', createOrder);
router.get('/:orderNumber', getOrderByNumber);
router.get('/', protect, adminOnly, getOrders);
router.put('/:id', protect, adminOnly, updateOrderStatus);

module.exports = router;
