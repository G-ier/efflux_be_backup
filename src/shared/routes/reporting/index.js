const route = require('express').Router();
const FacebookCompositeController = require('../../../modules/facebook/controllers/CompositeController');
const facebookCompositeController = new FacebookCompositeController();

route.post(
  '/facebook',
  async (req, res) => await facebookCompositeController.routeConversions(req, res),
);

module.exports = route;
