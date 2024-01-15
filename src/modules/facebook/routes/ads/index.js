const route = require('express').Router();
const AdController = require('../../controllers/AdController');
const adController = new AdController();

route.post('/ads-of-adsets', (req, res) => adController.getAdsOfAdset(req, res));

route.post('/details', (req, res) => adController.getDetailsOfAd(req, res));

module.exports = route;
