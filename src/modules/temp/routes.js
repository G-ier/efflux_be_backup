const route = require('express').Router();
const TemporaryController = require('./methods');
const temporaryController = new TemporaryController();

// Find the ad accounts belonging to a user and return them.
// use ad accounts to get the all list
route.get(
  '/adAccounts',
  async (req, res) => await temporaryController.fetchAdAccountsFromDatabase(req, res),
);
route.post('/adAccounts', async (req, res) => await temporaryController.updateAdAccount(req, res));
route.delete(
  '/adAccounts',
  async (req, res) => await temporaryController.deleteAdAccountUserMap(req, res),
);

// Find the users with ad accounts and return them.
route.get(
  '/users',
  async (req, res) => await temporaryController.fetchUsersWithAdAccounts(req, res),
);
route.get(
  '/users-formatted',
  async (req, res) => await temporaryController.fetchUsersWithAdAccountsForNewEfflux(req, res),
);
route.get(
  '/user_accounts',
  async (req, res) => await temporaryController.fetchUserAccounts(req, res),
);
// Column Presets
route.get(
  '/column-presets',
  async (req, res) => await temporaryController.getColumnPresets(req, res),
);
route.post(
  '/column-presets',
  async (req, res) => await temporaryController.createColumnPreset(req, res),
);
route.delete(
  '/column-presets',
  async (req, res) => await temporaryController.deleteColumnPreset(req, res),
);

route.post(
  '/update-password',
  async (req, res) => await temporaryController.updatePassword(req, res),
);

route.post(
  '/update-details',
  async (req, res) => await temporaryController.updateUserDetails(req, res),
);

// Find a user by their id and return them.
route.get('/user/:id', async (req, res) => await temporaryController.fetchUser(req, res));



// Find user organization and return them.
route.get(
  '/user/:userId/organization',
  async (req, res) => await temporaryController.fetchUserOrganization(req, res),
);

route.post(
  '/update-password',
  async (req, res) => await temporaryController.updatePassword(req, res),
);

route.post(
  '/update-details',
  async (req, res) => await temporaryController.updateUserDetails(req, res),
);

route.post(
  '/update-single-ad-account',
  async (req, res) => await temporaryController.updateSingleAdAccount(req, res),
);

module.exports = route;
