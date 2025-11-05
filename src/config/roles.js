const roles = {
  user: {
    can: [
      'viewInventories',
      'createInventory',
      'updateOwnInventory',
      'deleteOwnInventory',
      'manageOwnInventorySettings',
      'addItem',
      'updateItem',
      'deleteItem',
      'createComment',
      'likeItem',
      'viewProfile',
      'updateOwnProfile',
    ],
  },
  admin: {
    can: [
      'viewInventories',
      'createInventory',
      'updateOwnInventory',
      'deleteOwnInventory',
      'manageOwnInventorySettings',
      'addItem',
      'updateItem',
      'deleteItem',
      'createComment',
      'likeItem',
      'viewProfile',
      'updateOwnProfile',
      'updateAnyInventory',
      'deleteAnyInventory',
      'manageAnyInventorySettings',
      'viewUsers',
      'blockUser',
      'unblockUser',
      'deleteUser',
      'manageUserRoles',
    ],
  },
};

module.exports = roles;
