const User = require('../models/userModel');
const ApiError = require('../../../utils/apiError');
const { status } = require('http-status');
const { Op } = require('sequelize');

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
const createUser = async userData => {
  try {
    const user = await User.create(userData);
    return user;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new ApiError(status.BAD_REQUEST, 'User with this email already exists');
    }
    if (error.name === 'SequelizeValidationError') {
      throw new ApiError(status.BAD_REQUEST, error.errors.map(e => e.message).join(', '));
    }
    throw new ApiError(status.BAD_REQUEST, error.message);
  }
};

/**
 * Get user by query
 * @param {Object} query - Query object (Sequelize where clause)
 * @returns {Promise<Object|null>} User or null
 */
const getUserByQuery = async query => {
  try {
    return await User.findOne({ where: query });
  } catch (error) {
    throw new ApiError(status.INTERNAL_SERVER_ERROR, error.message);
  }
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User or null
 */
const getUserById = async userId => {
  try {
    if (!userId) {
      throw new ApiError(status.BAD_REQUEST, 'User ID is required');
    }
    return await User.findByPk(userId);
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError(status.INTERNAL_SERVER_ERROR, error.message);
  }
};

/**
 * Get user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User or null
 */
const getUserByEmail = async email => {
  try {
    if (!email || typeof email !== 'string') {
      throw new ApiError(status.BAD_REQUEST, 'Valid email is required');
    }
    return await User.findOne({ where: { email: email.toLowerCase() } });
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError(status.INTERNAL_SERVER_ERROR, error.message);
  }
};

/**
 * Get user by Google ID
 * @param {string} googleId - Google ID
 * @returns {Promise<Object|null>} User or null
 */
const getUserByGoogleId = async googleId => {
  try {
    if (!googleId) {
      throw new ApiError(status.BAD_REQUEST, 'Google ID is required');
    }
    return await User.findOne({ where: { googleId } });
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError(status.INTERNAL_SERVER_ERROR, error.message);
  }
};

/**
 * Update user by ID
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @param {boolean} isAdmin - Whether the update is by admin
 * @returns {Promise<Object|null>} Updated user or null
 */
const updateUserById = async (userId, updateData, isAdmin = false) => {
  try {
    if (!userId) {
      throw new ApiError(status.BAD_REQUEST, 'User ID is required');
    }

    if (!updateData || typeof updateData !== 'object') {
      throw new ApiError(status.BAD_REQUEST, 'Update data is required');
    }

    const allowedFields = isAdmin
      ? ['name', 'email', 'profilePicture', 'role', 'isActive', 'isBlocked']
      : ['name', 'email', 'profilePicture'];

    const sanitizedUpdate = {};

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        sanitizedUpdate[field] = updateData[field];
      }
    }

    if (Object.keys(sanitizedUpdate).length === 0) {
      throw new ApiError(status.BAD_REQUEST, 'No valid fields to update');
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return null;
    }

    await user.update(sanitizedUpdate);
    return user;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      throw new ApiError(status.BAD_REQUEST, 'Email already exists');
    }
    if (error.name === 'SequelizeValidationError') {
      throw new ApiError(status.BAD_REQUEST, error.errors.map(e => e.message).join(', '));
    }
    throw new ApiError(status.BAD_REQUEST, error.message);
  }
};

/**
 * Create or update user from Google OAuth
 * @param {Object} googleProfile - Google profile data (restructured from passport)
 * @returns {Promise<Object>} User object
 */
const createOrUpdateGoogleUser = async googleProfile => {
  const { Op } = require('sequelize');
  try {
    const { googleId, email, name, profilePicture } = googleProfile;
    const normalizedEmail = email.toLowerCase();

    // Try to find existing user by googleId or email
    let user = await User.findOne({
      where: {
        [Op.or]: [{ googleId }, { email: normalizedEmail }],
      },
    });

    if (user) {
      // Update existing user
      await user.update({
        lastLogin: new Date(),
        ...(googleId && { googleId }),
        ...(profilePicture && { profilePicture }),
      });
      return user;
    }

    // Create new user
    user = await User.create({
      googleId,
      name,
      email: normalizedEmail,
      authProvider: 'google',
      isEmailVerified: true,
      profilePicture,
      role: 'user',
      isActive: true,
      isBlocked: false,
      lastLogin: new Date(),
    });

    return user;
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      // Handle race condition - try to find and update again
      const { googleId, email } = googleProfile;
      const normalizedEmail = email.toLowerCase();

      const existingUser = await User.findOne({
        where: {
          [Op.or]: [{ googleId }, { email: normalizedEmail }],
        },
      });

      if (existingUser) {
        await existingUser.update({ lastLogin: new Date() });
        return existingUser;
      }
    }
    throw new ApiError(status.INTERNAL_SERVER_ERROR, error.message);
  }
};

/**
 * Update user's last login
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} Updated user
 */
const updateLastLogin = async userId => {
  try {
    if (!userId) {
      throw new ApiError(status.BAD_REQUEST, 'User ID is required');
    }
    const user = await User.findByPk(userId);
    if (!user) {
      return null;
    }
    await user.update({ lastLogin: new Date() });
    return user;
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError(status.INTERNAL_SERVER_ERROR, error.message);
  }
};

const getAllUsers = async (query = {}, options = {}) => {
  try {
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;

    // Convert sort object to Sequelize order array
    const order = Object.entries(sort).map(([field, direction]) => [
      field,
      direction === -1 ? 'DESC' : 'ASC',
    ]);

    const offset = (page - 1) * limit;

    const { rows: users, count: total } = await User.findAndCountAll({
      where: query,
      order,
      limit,
      offset,
    });

    // Convert to plain objects with virtuals
    const plainUsers = users.map(user => user.toJSON());

    return {
      users: plainUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new ApiError(status.INTERNAL_SERVER_ERROR, error.message);
  }
};

const deleteUserById = async userId => {
  try {
    if (!userId) {
      throw new ApiError(status.BAD_REQUEST, 'User ID is required');
    }
    const user = await User.findByPk(userId);
    if (!user) {
      return null;
    }
    await user.destroy();
    return user;
  } catch (error) {
    throw error instanceof ApiError
      ? error
      : new ApiError(status.INTERNAL_SERVER_ERROR, error.message);
  }
};

module.exports = {
  createUser,
  getUser: getUserByQuery,
  getUserByQuery,
  getUserById,
  getUserByEmail,
  getUserByGoogleId,
  updateUserById,
  createOrUpdateGoogleUser,
  updateLastLogin,
  getAllUsers,
  deleteUserById,
};
