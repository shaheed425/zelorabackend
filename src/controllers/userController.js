const User = require('../models/User');

// @desc    Get all users (Admin)
// @route   GET /api/users
const getUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user status (Admin)
// @route   PUT /api/users/:id/status
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({ success: true, message: `User status set to ${user.isActive ? 'active' : 'inactive'}`, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsers,
  toggleUserStatus,
};
