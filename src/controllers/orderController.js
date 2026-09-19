const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Create new order / checkout
// @route   POST /api/orders
const createOrder = async (req, res, next) => {
  try {
    const { customer, products, subtotal, discount, total, shippingAddress, notes } = req.body;

    if (!customer || !products || !products.length || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Missing required order fields' });
    }

    const orderNumber = 'ZEL-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);

    const order = await Order.create({
      orderNumber,
      customer,
      products,
      subtotal,
      discount: discount || 0,
      total,
      shippingAddress,
      notes: notes || '',
      paymentStatus: 'PENDING',
      orderStatus: 'CONFIRMED',
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by order number
// @route   GET /api/orders/:orderNumber
const getOrderByNumber = async (req, res, next) => {
  try {
    const order = await Order.findOne({ orderNumber: req.params.orderNumber });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (Admin)
// @route   GET /api/orders
const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status (Admin)
// @route   PUT /api/orders/:id
const updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, paymentStatus } = req.body;
    const updateData = {};
    if (orderStatus) updateData.orderStatus = orderStatus;
    if (paymentStatus) updateData.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.status(200).json({ success: true, message: 'Order updated', data: order });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  getOrderByNumber,
  getOrders,
  updateOrderStatus,
};
