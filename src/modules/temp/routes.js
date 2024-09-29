const route = require('express').Router();
const { TemporaryController } = require('./methods');
const temporaryController = new TemporaryController();


// Media Buyers Page
route.get('/adAccounts', async (req, res) => await temporaryController.fetchAdAccountsFromDatabase(req, res));
route.get('/media-buyer-adAccounts', async (req, res) => await temporaryController.fetchMediaBuyerAdAccounts(req, res));
route.post('/assign-adaccount-to-user', async (req, res) => await temporaryController.assignAdAccountToUser(req, res));
route.delete('/unassign-adaccount-from-user', async (req, res) => await temporaryController.unassignAdAccountFromUser(req, res));

route.get('/network-campaigns', async (req, res) => await temporaryController.fetchNetworkCampaignsFromDatabase(req, res));
route.get('/media-buyer-network-campaigns', async (req, res) => await temporaryController.fetchMediaBuyerNetworkCampaigns(req, res));
route.post('/assign-network-campaign-to-user', async (req, res) => await temporaryController.assignNetworkCampaignToUser(req, res));
route.delete('/unassign-network-campaign-from-user', async (req, res) => await temporaryController.unassignNetworkCampaignFromUser(req, res));

// Column Presets
route.get('/column-presets', async (req, res) => await temporaryController.getColumnPresets(req, res));
route.post('/column-presets', async (req, res) => await temporaryController.createColumnPreset(req, res));
route.delete('/column-presets', async (req, res) => await temporaryController.deleteColumnPreset(req, res));

// Routes called on login
route.get('/users', async (req, res) => await temporaryController.fetchUsersWithRelations(req, res));

// Efflux Health Page
route.get('/link-generation-usage-data', async (req, res) => await temporaryController.fetchLinkGenerationUsageData(req, res));
route.get('/operational-errors', async (req, res) => await temporaryController.fetchOperationalErrors(req, res));
route.post('/operational-errors/change-status', async (req, res) => await temporaryController.changeOperationalErrorStatus(req, res));

// Unknown routes to me [Deni]
route.get('/users-formatted', async (req, res) => await temporaryController.fetchUsersWithAdAccountsForNewEfflux(req, res));
route.get('/user_accounts', async (req, res) => await temporaryController.fetchUserAccounts(req, res));
route.post('/update-password', async (req, res) => await temporaryController.updatePassword(req, res));
route.post('/update-details', async (req, res) => await temporaryController.updateUserDetails(req, res));
route.get('/user/:id', async (req, res) => await temporaryController.fetchUser(req, res));
route.get('/user/:userId/organization', async (req, res) => await temporaryController.fetchUserOrganization(req, res));
route.post('/update-single-ad-account', async (req, res) => await temporaryController.updateSingleAdAccount(req, res));

module.exports = route;
