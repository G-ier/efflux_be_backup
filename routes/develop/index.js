const route = require("express").Router();

const {
  updateSystem1Hourly
} = require('../../services/system1Service');


const {
  updateS1_Spreadsheet,
} = require("../../controllers/spreadsheetController");


// @route     /api/debug-cron-jobs
// @desc     Runs Cron Jobs
route.get("/debug-cron-jobs", async (req, res) => {

  try {
    // Update the database
    await updateSystem1Hourly();

    // Update the spreadsheet
    await updateS1_Spreadsheet();
    res.status(200).send({ message: "debug-cron-jobs" });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ error: err.toString() });
  }

});


module.exports = route;
