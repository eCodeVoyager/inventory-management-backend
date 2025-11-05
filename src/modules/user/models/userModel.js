const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
  },
  profilePicture: {
    type: String,
    default: null,
  },
  authProvider: {
    type: String,
    enum: ['google'],
    default: 'google',
  },
  isEmailVerified: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  credits: {
    type: Number,
    default: 2500,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

// Virtual for avatar URL (fallback to generated avatar)
userSchema.virtual('avatar').get(function() {
  return this.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=0D8ABC&color=fff`;
});

// Virtual for id (alias for _id for consistency)
userSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);

module.exports = User;
