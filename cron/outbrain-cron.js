const { CronJob } = require("cron");
const Rules = require("../constants/cron");
const { updateOutbrainData } = require("../controllers/outbrainController");
const {updateOB_Spreadsheet} = require('../controllers/spreadsheetController');

const disableCron = process.env.DISABLE_CRON === "true";

async function updateOutbrainDataJob() {
  await updateOutbrainData();
  console.log("UPDATE OUTBRAIN DATA JOB FINISHED");
  await updateOB_Spreadsheet();
}

const updateOutbrainDataCron = new CronJob(
  Rules.OB_REGULAR,
  updateOutbrainDataJob,
);

const initializeOBCron = () => {
  if (!disableCron) {
    // updateOutbrainDataCron.start();
  }

  // DEBUG: uncomment to test immediately
  // updateOutbrainDataJob().then(() => { console.log("debug done"); });
};

module.exports = {
  initializeOBCron,
};
