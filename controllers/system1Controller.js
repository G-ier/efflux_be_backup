const {
  hourlyMediaBuyerFacebookSystem1,
  facebookSystem1ByDate,
  campaignsFacebookSystem1,
} = require('../common/aggregations');
const { yesterdayYMD, dayYMD } = require('../common/day');
const { processDateHoles, processHourlyData } = require('../common/helpers');

/**
 * @name getFacebookHourlyData
 * Returns facebook/System1 hourly data
 * @param options
 */
async function getFacebookHourlyData(options) {
  const {
    start_date, end_date, media_buyer, account_id, q
  } = options;
  const { rows } = await hourlyMediaBuyerFacebookSystem1(
    start_date,
    end_date,
    media_buyer,
    null,
    account_id,
    q,
  );

  return processHourlyData(rows);
}

async function getFacebookSystem1ByDates({ start_date, end_date }) {

  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);
  const { rows } = await facebookSystem1ByDate(startDate, endDate);
  return processDateHoles(rows, startDate, endDate);
}

async function getCampaignsFacebookSystem1({ start_date, end_date, media_buyer, ad_account }) {
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);

  const { rows } = await campaignsFacebookSystem1(startDate, endDate, media_buyer, ad_account);
  return rows;
}

module.exports = {
  getFacebookHourlyData,
  getFacebookSystem1ByDates,
  getCampaignsFacebookSystem1,
};
