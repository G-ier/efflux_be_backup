// Third party imports
const route = require('express').Router();

// Local imports
const SherlockController = require('./controllers/SherlockController');
const sherlockController = new SherlockController();

route.get('/reports', async (req, res) => await sherlockController.generateFindingsDaily(req, res));

module.exports = route;
