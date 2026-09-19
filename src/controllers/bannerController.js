const Banner = require('../models/Banner');

// @desc    Get active homepage banners
// @route   GET /api/banners
const getBanners = async (req, res, next) => {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1 });
    res.status(200).json({ success: true, data: banners });
  } catch (error) {
    next(error);
  }
};

// @desc    Create banner (Admin)
// @route   POST /api/banners
const createBanner = async (req, res, next) => {
  try {
    const { title, subtitle, image, link, buttonText, order } = req.body;
    if (!title || !image) {
      return res.status(400).json({ success: false, message: 'Title and image are required' });
    }

    const banner = await Banner.create({
      title,
      subtitle: subtitle || '',
      image,
      link: link || '/shop',
      buttonText: buttonText || 'Explore Collection',
      order: order || 0,
    });

    res.status(201).json({ success: true, message: 'Banner created', data: banner });
  } catch (error) {
    next(error);
  }
};

// @desc    Update banner (Admin)
// @route   PUT /api/banners/:id
const updateBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    res.status(200).json({ success: true, message: 'Banner updated', data: banner });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete banner (Admin)
// @route   DELETE /api/banners/:id
const deleteBanner = async (req, res, next) => {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id);
    if (!banner) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }
    res.status(200).json({ success: true, message: 'Banner deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
};
