const express = require('express');
const adminController = require('../controllers/adminController');
const authMiddleware = require('../../../middleware/authMiddleware');
const authorize = require('../../../middleware/rbacMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.use(authorize(['viewAllUsers']));

router.get('/users', adminController.getAllUsers);
router.patch('/users/:userId/block', authorize(['blockUser']), adminController.blockUser);
router.patch('/users/:userId/unblock', authorize(['unblockUser']), adminController.unblockUser);
router.delete('/users/:userId', authorize(['deleteUser']), adminController.deleteUser);
router.patch('/users/:userId/promote', authorize(['promoteToAdmin']), adminController.promoteToAdmin);
router.patch('/users/:userId/demote', authorize(['removeAdmin']), adminController.removeAdmin);

module.exports = router;
