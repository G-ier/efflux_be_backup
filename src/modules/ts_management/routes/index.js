const route = require('express').Router();
const AdAccountManagementController = require('../controllers/adAccountManagementController');
const adAccountManagementController = new AdAccountManagementController();

// Admin exclude offers
route.post('/exclude-ad-account', async (req, res) => await adAccountManagementController.excludeAdAccount(req, res));
route.post('/include-excluded-ad-accounts', async (req, res) => await adAccountManagementController.includeExcludedAdAccount(req, res));
route.get('/fetch-ad-accounts', async (req, res) => await adAccountManagementController.fetchAdAccounts(req, res));
route.get('/fetch-excluded-ad-accounts', async (req, res) => await adAccountManagementController.fetchExcludedAdAccounts(req, res));


module.exports = route;
