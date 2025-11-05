const userService = require('../services/userService');
const ApiResponse = require('../../../utils/apiResponse');
const ApiError = require('../../../utils/apiError');
const catchAsync = require('../../../utils/catchAsync');
const { status } = require('http-status');

const getAllUsers = catchAsync(async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 }
  };

  const users = await userService.getAllUsers(query, options);
  res.json(new ApiResponse(status.OK, users, 'Users retrieved successfully'));
});

const blockUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  if (userId === req.user.id) {
    throw new ApiError(status.BAD_REQUEST, 'Cannot block yourself');
  }

  const user = await userService.updateUserById(userId, { isBlocked: true }, true);
  
  if (!user) {
    throw new ApiError(status.NOT_FOUND, 'User not found');
  }

  res.json(new ApiResponse(status.OK, { id: user._id, isBlocked: user.isBlocked }, 'User blocked successfully'));
});

const unblockUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await userService.updateUserById(userId, { isBlocked: false }, true);
  
  if (!user) {
    throw new ApiError(status.NOT_FOUND, 'User not found');
  }

  res.json(new ApiResponse(status.OK, { id: user._id, isBlocked: user.isBlocked }, 'User unblocked successfully'));
});

const deleteUser = catchAsync(async (req, res) => {
  const { userId } = req.params;

  if (userId === req.user.id) {
    throw new ApiError(status.BAD_REQUEST, 'Cannot delete yourself');
  }

  const deleted = await userService.deleteUserById(userId);
  
  if (!deleted) {
    throw new ApiError(status.NOT_FOUND, 'User not found');
  }

  res.json(new ApiResponse(status.OK, null, 'User deleted successfully'));
});

const promoteToAdmin = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await userService.updateUserById(userId, { role: 'admin' }, true);
  
  if (!user) {
    throw new ApiError(status.NOT_FOUND, 'User not found');
  }

  res.json(new ApiResponse(status.OK, { id: user._id, role: user.role }, 'User promoted to admin successfully'));
});

const removeAdmin = catchAsync(async (req, res) => {
  const { userId } = req.params;

  const user = await userService.updateUserById(userId, { role: 'user' }, true);
  
  if (!user) {
    throw new ApiError(status.NOT_FOUND, 'User not found');
  }

  res.json(new ApiResponse(status.OK, { id: user._id, role: user.role }, 'Admin privileges removed successfully'));
});

module.exports = {
  getAllUsers,
  blockUser,
  unblockUser,
  deleteUser,
  promoteToAdmin,
  removeAdmin,
};
