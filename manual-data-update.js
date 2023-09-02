const { yesterdayYMD } = require('./common/day');

const updateCrossroads = async (date) => {

  const { updateCrossroadsData } = require('./services/crossroadsService');
  const CROSSROADS_ACCOUNTS = [
    {
      id: 'account-1',
      key: '1a3c3ae4-2755-450d-ac24-8d10371910c5',
    }
  ];

  console.log("Updating crossroads data")
  await updateCrossroadsData(CROSSROADS_ACCOUNTS[0], date)
  console.log("Done")
}

const updateFacebook = async (date) => {

  const { updateFacebookData, updateFacebookInsights } = require('./controllers/facebookController');
  console.log("Updating facebook data")
  await updateFacebookData(date)
  console.log("Done")
  console.log("Updating facebook insights")
  await updateFacebookInsights(date)
  console.log("Done")
};

const updateInsights = async (trafficSource, startDate, endDate) => {

  const { ruleThemAllQuery } = require('./services/insightsService');
  const { updateInsightsOnDatabase } = require('./controllers/insightsController');

  const { rows } = await ruleThemAllQuery('crossroads', trafficSource, startDate, endDate)
  console.log("Fetched rows:", rows.length)
  await updateInsightsOnDatabase(rows, trafficSource)
  console.log("Done")

};

const main = async (date) => {
  let start = Date.now();
  await updateCrossroads(date)
  await updateFacebook(date)
  await updateInsights('tiktok', yesterdayYMD(date), date)
  await updateInsights('facebook', yesterdayYMD(date), date)
  let timeTaken = Date.now() - start;
  console.log("Total time taken : " + (timeTaken / 1000) + " seconds");
}

const date = '2023-09-01'
main(date)
