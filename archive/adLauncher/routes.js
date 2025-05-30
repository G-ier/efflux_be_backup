const route = require('express').Router();
const AdLauncherController = require('./controllers/AdLauncherController');

const adLauncherController = new AdLauncherController();
// @route   /api/add-launcher/media/generate-presigned-url
// @desc    POST Generate presigned url
route.post('/media/generate-presigned-url', async (req, res) => {
  adLauncherController.generatePresignedUrl(req, res);
});

// @route   /api/add-launcher/redirect-urls
// @desc    GET Redirect urls
route.get('/redirect-urls', async (req, res) => {
  adLauncherController.getRedirectUrls(req, res);
});

// @route   /api/add-launcher/get-domain
// @desc    GET Domains
route.get('/domains', async (req, res) => {
  adLauncherController.getDomain(req, res);
});

// @route /api/add-launcher/tonic/campaigns
// @desc  GET Get campaigns from tonic
route.get('/tonic/campaigns', async (req, res) => {
  adLauncherController.getTonicCampaigns(req, res);
});

// @route /api/add-launcher/tiktok/launcher
// @desc  GET Start launcher
route.get('/tiktok/launcher', async (req, res) => {
  adLauncherController.launchTiktokFromMonday(req, res);
});


module.exports = route;
