const userController = require("./controllers/userController");
const userModel = require("./models/userModel");
const userRoutes = require("./routes/userRoutes");
const userService = require("./services/userService");
const userValidation = require("./validations/userValidation");

module.exports = {
  userController,
  userModel,
  userRoutes,
  userService,
  userValidation,
};
