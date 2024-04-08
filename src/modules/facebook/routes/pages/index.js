const route = require("express").Router();
const PageController = require("../../controllers/PageController");
const CompositeController = require("../../controllers/CompositeController");
const compositeController = new CompositeController();
const pageController = new PageController();


// @route    GET /api/facebook/pageTest
// @desc     Fetch pages
// @Access   Private
route.get('/', async (req, res) => await pageController.fetchPages(req, res));


route.get('/:adAccountId', async (req, res) => await pageController.fetchPagesByAdAccount(req, res));

// @route    /api/facebook/pageTest/refreshPages
// @desc     Get pages refresh data
// @Access   Private
route.get("/refresh-pages", async (req, res) => {
  await compositeController.syncPages(req, res);
});

module.exports = route;
