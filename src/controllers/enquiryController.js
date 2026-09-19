const Enquiry = require('../models/Enquiry');
const Product = require('../models/Product');

// @desc    Submit new enquiry
// @route   POST /api/enquiries
const createEnquiry = async (req, res, next) => {
  try {
    const { customerName, phone, email, product, productName, message, source } = req.body;

    if (!customerName || !phone) {
      return res.status(400).json({ success: false, message: 'Customer name and phone number are required' });
    }

    let resolvedProductName = productName || '';
    if (product && !resolvedProductName) {
      const prodDoc = await Product.findById(product);
      if (prodDoc) resolvedProductName = prodDoc.name;
    }

    const enquiry = await Enquiry.create({
      customerName,
      phone,
      email: email || '',
      product: product || null,
      productName: resolvedProductName,
      message: message || '',
      source: source || 'website',
      status: 'NEW',
    });

    res.status(201).json({
      success: true,
      message: 'Enquiry submitted successfully! Our team will contact you shortly.',
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all enquiries (Admin)
// @route   GET /api/enquiries
const getEnquiries = async (req, res, next) => {
  try {
    const enquiries = await Enquiry.find().populate('product', 'name slug featuredImage').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: enquiries,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update enquiry status (Admin)
// @route   PUT /api/enquiries/:id
const updateEnquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const enquiry = await Enquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Enquiry status updated',
      data: enquiry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete enquiry (Admin)
// @route   DELETE /api/enquiries/:id
const deleteEnquiry = async (req, res, next) => {
  try {
    const enquiry = await Enquiry.findByIdAndDelete(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    res.status(200).json({ success: true, message: 'Enquiry deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEnquiry,
  getEnquiries,
  updateEnquiryStatus,
  deleteEnquiry,
};
