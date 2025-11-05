const User = require('../models/userModel');
const ApiError = require('../../../utils/apiError');
const { status } = require('http-status');

/**
 * Create a new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
const createUser = async userData => {
  try {
    const user = new User(userData);
    await user.save();
    return user;
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(status.BAD_REQUEST, 'User with this email already exists');
    }
    throw new ApiError(status.BAD_REQUEST, error.message);
  }
};

/**
 * Get user by query
 * @param {Object} query - Query object
 * @returns {Promise<Object|null>} User or null
 */
const getUserByQuery = async query => {
  try {
    return await User.findOne(query);
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
    return await User.findById(userId);
  } catch (error) {
    if (error.name === 'CastError') {
      throw new ApiError(status.BAD_REQUEST, 'Invalid user ID format');
    }
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
    return await User.findOne({ email: email.toLowerCase() });
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
    return await User.findOne({ googleId });
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

    const user = await User.findByIdAndUpdate(
      userId,
      { ...sanitizedUpdate, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    return user;
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(status.BAD_REQUEST, 'Email already exists');
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
  try {
    const { googleId, email, name, profilePicture } = googleProfile;
    const normalizedEmail = email.toLowerCase();

    const user = await User.findOneAndUpdate(
      { $or: [{ googleId }, { email: normalizedEmail }] },
      {
        $setOnInsert: {
          googleId,
          name,
          email: normalizedEmail,
          authProvider: 'google',
          isEmailVerified: true,
          profilePicture,
          role: 'user',
          isActive: true,
          isBlocked: false,
          createdAt: new Date(),
        },
        $set: {
          lastLogin: new Date(),
          ...(googleId && { googleId }),
          ...(!profilePicture && profilePicture && { profilePicture }),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return user;
  } catch (error) {
    if (error.code === 11000) {
      const { googleId, email } = googleProfile;
      const normalizedEmail = email.toLowerCase();

      const existingUser = await User.findOne({
        $or: [{ googleId }, { email: normalizedEmail }],
      });

      if (existingUser) {
        existingUser.lastLogin = new Date();
        await existingUser.save();
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
    return await User.findByIdAndUpdate(userId, { lastLogin: new Date() }, { new: true });
  } catch (error) {
    if (error.name === 'CastError') {
      throw new ApiError(status.BAD_REQUEST, 'Invalid user ID format');
    }
    throw error instanceof ApiError
      ? error
      : new ApiError(status.INTERNAL_SERVER_ERROR, error.message);
  }
};

const getAllUsers = async (query = {}, options = {}) => {
  try {
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;

    const users = await User.find(query)
      .select('-__v')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const total = await User.countDocuments(query);

    return {
      users,
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
    const result = await User.findByIdAndDelete(userId);
    return result;
  } catch (error) {
    if (error.name === 'CastError') {
      throw new ApiError(status.BAD_REQUEST, 'Invalid user ID format');
    }
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
