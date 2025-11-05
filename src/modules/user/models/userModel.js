const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../../../config/db');

class User extends Model {
  // Virtual getter for avatar
  get avatar() {
    return (
      this.profilePicture ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(this.name)}&background=0D8ABC&color=fff`
    );
  }

  // Method to get plain user object with virtuals
  toJSON() {
    const values = { ...this.get() };
    // Add virtual fields
    values.avatar = this.avatar;
    return values;
  }
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
      set(value) {
        this.setDataValue('name', value?.trim());
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
        notEmpty: true,
      },
      set(value) {
        this.setDataValue('email', value?.toLowerCase().trim());
      },
    },
    googleId: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    profilePicture: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null,
    },
    authProvider: {
      type: DataTypes.ENUM('google', 'facebook'),
      allowNull: false,
      defaultValue: 'google',
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      allowNull: false,
      defaultValue: 'user',
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: true,
    underscored: false,
    indexes: [
      {
        unique: true,
        fields: ['email'],
      },
      {
        unique: true,
        fields: ['googleId'],
        where: {
          googleId: {
            [require('sequelize').Op.ne]: null,
          },
        },
      },
    ],
  }
);

module.exports = User;
