const { Sequelize } = require('sequelize');

// Create Sequelize instance
const sequelize = new Sequelize(
  process.env.DB_NAME || 'inventory_management',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: false,
    },
  }
);

// Test connection function
const ConnectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      `✅ PostgreSQL Connected: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`
    );

    // Sync models in development (be careful with this in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('📊 Database models synchronized');
    }

    return sequelize;
  } catch (error) {
    console.error(`❌ PostgreSQL connection error: ${error.message}`);
    throw error;
  }
};

// Graceful shutdown
const closeDB = async () => {
  try {
    await sequelize.close();
    console.log('🛑 PostgreSQL connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

module.exports = ConnectDB;
module.exports.sequelize = sequelize;
module.exports.closeDB = closeDB;
