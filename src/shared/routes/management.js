const route = require("express").Router();

const FacebookCompositeController = require("../../modules/facebook/controllers/CompositeController");
const TiktokCompositeController = require("../../modules/tiktok/controllers/CompositeController");

const facebookCompositeController = new FacebookCompositeController();
const tiktokCompositeController = new TiktokCompositeController();

route.get('/update-entity', async (req, res) => {
    const { trafficSource } = req.query;  // Assuming traffic_source is passed as a query parameter

    if (!trafficSource) {
        return res.status(400).send('Traffic source is required');
    }

    switch (trafficSource.toLowerCase()) {
        case 'facebook':
            return facebookCompositeController.updateEntity(req, res);
        case 'tiktok':
            return tiktokCompositeController.updateEntity(req, res);
        default:
            return res.status(400).send('Invalid traffic source');
    }
});

module.exports = route;