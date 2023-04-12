const { CronJob } = require('cron');
const { yesterdayYMD, someDaysAgoYMD, todayYMD, todayYMDHM,todayTenMinsAgoYMDHM, todayFifteenMinsAgoYMDHM} = require('../common/day');
const { updateClickflareData } = require('../services/clickflareService');
const Rules = require('../constants/cron');
const { clickflareTimezone, sheetsArr } = require('../constants/clickflare');
const { updateCF_DaySpreadsheet } = require('../controllers/spreadsheetController');
const {clickflareCampaigns} = require("../common/aggregations/clickflare_report"); //workflow change

const disableCron = process.env.DISABLE_CRON === 'true'

const updateClickflare = async () => {
  const startDate = todayFifteenMinsAgoYMDHM();
  const endDate = todayYMDHM();
  //console.log("Start Date: ", startDate);
  //console.log("End Date: ", endDate);
  
  // Retrieve data in the timelapse specified and save them on the database.
  await updateClickflareData(startDate, endDate, clickflareTimezone);
  //16:59 last insert finished
  sheetsArr.forEach(async (sheet) => {
     let min_date = someDaysAgoYMD(sheet.day - 1); 
     let endDay = sheet.day == 1 ? todayYMD() : yesterdayYMD(); 
     min_date = min_date + ' 00:00:00';
     endDay = endDay + ' 23:59:59';
     let traffic_source = sheet.traffic_source === 'facebook' ? `('62b23798ab2a2b0012d712f7', '62afb14110d7e20012e65445',
       '622f32e17150e90012d545ec', '62f194b357dde200129b2189')` : `('62b725e4ab2a2b0012d71334')`
     let camp_data = await clickflareCampaigns(min_date, endDay, 'campaign', traffic_source);
     let adset_data = await clickflareCampaigns(min_date, endDay, 'adset', traffic_source);

     await updateCF_DaySpreadsheet(sheet, camp_data, adset_data)
   })
}

const clickflareRegularCron = new CronJob(
  Rules.CF_REGULAR,
  (async () => {
    console.log('start clickflare data downloading')
    updateClickflare();
  }),
);


const initializeCFCron = () => {
  // (async () => {
  //   updateClickflare()
  // })();

  if (!disableCron) {
    clickflareRegularCron.start();
  }
};

module.exports = {
  initializeCFCron,
  updateClickflare
};
