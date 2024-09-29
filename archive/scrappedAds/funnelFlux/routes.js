const route = require("express").Router();

const FFDataServiceController = require("./controllers/FFDataServiceController");
const ffDataService = new FFDataServiceController();


// @route    /api/ff/adset-hourly-report
// @desc     GET generate funnel flux adset hourly report
// @Access   Private
route.get("/adset-hourly-report", async (req, res) => {
  ffDataService.generateAdsetHourlyReport(req, res);
});


module.exports = route;
