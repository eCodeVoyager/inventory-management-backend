const userController = require("./controllers/userController");
const adminController = require("./controllers/adminController");
const userModel = require("./models/userModel");
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const userService = require("./services/userService");
const userValidation = require("./validations/userValidation");

module.exports = {
  userController,
  adminController,
  userModel,
  userRoutes,
  adminRoutes,
  userService,
  userValidation,
};
