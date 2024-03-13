const route = require('express').Router();
const AdLauncherController = require('./controllers/AdLauncherController');

const adLauncherController = new AdLauncherController();
// @route   /api/add-launcher/media/generate-presigned-url
// @desc    POST Generate presigned url
route.post('/media/generate-presigned-url', async (req, res) => {
  adLauncherController.generatePresignedUrl(req, res);
});


module.exports = route;
