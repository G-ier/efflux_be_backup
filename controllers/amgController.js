const {
  hourlyMediaBuyerFacebookAMG,
  hourlyMediaBuyerGoogleAMG,
  facebookAMGByDate,
  googleAMGByDate,
  campaignsFacebookAMG,
  campaignsGoogleAMG,
} = require('../common/aggregations');
const { yesterdayYMD, dayYMD } = require('../common/day');
const { processDateHoles, processHourlyData } = require('../common/helpers');

/**
 * @name getFacebookHourlyData
 * Returns facebook/amg hourly data
 * @param options
 */
async function getFacebookHourlyData(options) {
  const {
    start_date, end_date, media_buyer, account_id
  } = options;
  const { rows } = await hourlyMediaBuyerFacebookAMG(
    start_date,
    end_date,
    media_buyer,
    null,
    account_id,
  );

  return processHourlyData(rows);
}

/**
 * @name getGoogleHourlyData
 * Returns google/amg hourly data
 * @param options
 */
async function getGoogleHourlyData(options) {
  const {
    start_date, end_date, media_buyer, account_id
  } = options;
  const { rows } = await hourlyMediaBuyerGoogleAMG(
    start_date,
    end_date,
    media_buyer,
    null,
    account_id,
  );

  return processHourlyData(rows);
}

async function getFacebookAmgByDates({ start_date, end_date }) {
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);
  const { rows } = await facebookAMGByDate(startDate, endDate);
  return processDateHoles(rows, startDate, endDate);
}

async function getGoogleAmgByDates({ start_date, end_date }) {
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);
  const { rows } = await googleAMGByDate(startDate, endDate);
  return processDateHoles(rows, startDate, endDate);
}

async function getCampaignsFacebookAmg({ start_date, end_date, media_buyer, ad_account }) {
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);
  const { rows } = await campaignsFacebookAMG(startDate, endDate, media_buyer, ad_account);
  return rows;
}

async function getCampaignsGoogleAmg({ start_date, end_date, media_buyer, ad_account }) {
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);
  const { rows } = await campaignsGoogleAMG(startDate, endDate, media_buyer, ad_account);
  return rows;
}

module.exports = {
  getFacebookHourlyData,
  getGoogleHourlyData,
  getFacebookAmgByDates,
  getGoogleAmgByDates,
  getCampaignsFacebookAmg,
  getCampaignsGoogleAmg,
};
