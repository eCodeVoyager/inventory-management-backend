const roles = {
  admin: {
    can: [
      'viewAllUsers',
      'blockUser',
      'unblockUser',
      'deleteUser',
      'promoteToAdmin',
      'removeAdmin',
      'viewAllInventories',
      'editAnyInventory',
      'deleteAnyInventory',
      'viewAllItems',
      'editAnyItem',
      'deleteAnyItem',
    ],
  },
  user: {
    can: [
      'viewPublicContent',
      'createInventory',
      'editOwnInventory',
      'deleteOwnInventory',
      'addItemToAccessibleInventory',
      'editItemInAccessibleInventory',
      'deleteItemInAccessibleInventory',
      'likeItem',
      'commentOnAccessibleInventory',
      'viewOwnProfile',
      'editOwnProfile',
    ],
  },
};

module.exports = roles;
