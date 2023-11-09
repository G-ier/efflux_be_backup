const route = require("express").Router();
const PageController = require("../../controllers/PageController");
const pageController = new PageController();


// @route    GET /api/facebook/pageTest
// @desc     Fetch pages
// @Access   Private
route.get('/', async (req, res) => await pageController.fetchPages(req, res));


// @route    /api/facebook/pageTest/refreshPages
// @desc     Get pages refresh data
// @Access   Private
route.get("/refreshPages", async (req, res) => {
    await pageController.syncPages(req, res);
  });

module.exports = route;