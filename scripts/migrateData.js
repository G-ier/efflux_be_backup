const CrossroadsService = {CompositeService} = require('../src/modules/crossroads/services/CompositeService');
const FacebookService = {CompositeService} = require('../src/modules/facebook/services/CompositeService');
const TiktokService = {CompositeService} = require('../src/modules/tiktok/services/CompositeService');
const AggregatesService = require('../src/modules/aggregates/services/AggregatesService');
const { yesterdayYMD } = require('../src/shared/helpers/calendar');

const updateAggregates = async (startDate, endDate) => {
  const aggregatesService = new AggregatesService();
  console.log('Updating aggregates facebook crossroads...');
  await aggregatesService.updateAggregates('crossroads', 'facebook', startDate, endDate);
  console.log('Updating aggregates tiktok crossroads...');
  await aggregatesService.updateAggregates('crossroads', 'tiktok', startDate, endDate);
  console.log("Done!")
};

const updateCrossroadsData = async () => {
  const crossroadsService = new CrossroadsService();
  console.log('Updating crossroads data...');
  const account = {
    id: "account-1",
    key: "1a3c3ae4-2755-450d-ac24-8d10371910c5",
  }
  await crossroadsService.updateData(account, '2023-09-11');
  console.log("Done!")
}

function generateDatesBetween(startDateStr, endDateStr) {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  const dates = [];

  while (startDate <= endDate) {
      dates.push(startDate.toISOString().slice(0, 10));  // extracts the YYYY-MM-DD part from ISO string
      startDate.setDate(startDate.getDate() + 1);  // increments the date by 1 day
  }

  return dates;
}

const syncAllData = async (startDate, endDate) => {

  const crossroadsService = new CrossroadsService();
  const facebookService = new FacebookService();
  const tiktokService = new TiktokService();
  const aggregatesService = new AggregatesService();

  const dateRange = generateDatesBetween(startDate, endDate);

  for (let i=0; i<dateRange.length; i++) {
    const date = dateRange[i];

    console.log(`Updating facebook data for ${date}...`);

    await facebookService.updateFacebookData(date, {
      updatePixels: true,
      updateCampaigns: true,
      updateAdsets: true,
      updateInsights: true
    })

    console.log(`Updating tiktok data for ${date}...`);
    await tiktokService.updateTikTokData(date)

    console.log(`Updating crossroads data for ${date}...`);
    const account = {
      id: "account-1",
      key: "1a3c3ae4-2755-450d-ac24-8d10371910c5",
    }
    await crossroadsService.updateData(account, date)
  }

  const minDate = yesterdayYMD(dateRange[0]);
  const maxDate = dateRange[dateRange.length - 1];

  console.log(`Updating aggregates facebook crossroads for date range ${minDate} - ${maxDate}...`);
  await aggregatesService.updateAggregates('crossroads', 'facebook', minDate, maxDate)
  console.log(`Updating aggregates tiktok crossroads for date range ${minDate} - ${maxDate}...`);
  await aggregatesService.updateAggregates('crossroads', 'tiktok', minDate, maxDate)
  console.log("Done!")

};

updateAggregates('2023-09-14', '2023-09-15');

