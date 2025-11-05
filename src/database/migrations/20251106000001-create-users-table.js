'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      googleId: {
        type: Sequelize.STRING(255),
        allowNull: true,
        unique: true,
      },
      profilePicture: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      authProvider: {
        type: Sequelize.ENUM('google', 'facebook'),
        allowNull: false,
        defaultValue: 'google',
      },
      role: {
        type: Sequelize.ENUM('user', 'admin'),
        allowNull: false,
        defaultValue: 'user',
      },
      isEmailVerified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isBlocked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      lastLogin: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('users', ['email'], {
      unique: true,
      name: 'users_email_unique',
    });

    await queryInterface.addIndex('users', ['googleId'], {
      unique: true,
      name: 'users_googleId_unique',
      where: {
        googleId: {
          [Sequelize.Op.ne]: null,
        },
      },
    });

    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['isActive']);
    await queryInterface.addIndex('users', ['createdAt']);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.dropTable('users');
  },
};
