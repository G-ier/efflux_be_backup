const route = require("express").Router();
const {
  updateClickflare
} = require("../../cron/clickflare-cron")
const db = require('../../data/dbConfig');
const _ = require('lodash');


// @route     /api/debug-cron-jobs
// @desc     Runs Cron Jobs
route.get("/debug-cron-jobs", async (req, res) => {

  try {
    updateClickflare()
    res.status(200).send({ message: "debug-cron-jobs" });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ error: `${err.toString()}, Spreadsheet Id: ${process.env.SYSTEM1_SPREADSHEET_ID}` });
  }

});


module.exports = route;
