const db = require('../data/dbConfig');

const {
  hourlyMediaBuyerFacebookCrossroads,
  hourlyMediaBuyerGoogleCrossroads,
  facebookCrossroadsByDate,
  googleCrossroadsByDate,
  campaignsFacebookCrossroads,
  campaignsGoogleCrossroads,
} = require('../common/aggregations');
const { yesterdayYMD, dayYMD } = require('../common/day');
const { processDateHoles, processHourlyData } = require('../common/helpers');

/**
 * @name getFacebookHourlyData
 * Returns facebook/crossroads hourly data
 * @param options
 */
async function getFacebookHourlyData(options) {
  const {
    start_date, end_date, media_buyer, account_id, q
  } = options;
  const { rows } = await hourlyMediaBuyerFacebookCrossroads(
    start_date,
    end_date,
    media_buyer,
    null,
    account_id,
    q,
  );

  return processHourlyData(rows);
}

/**
 * @name getGoogleHourlyData
 * Returns google/crossroads hourly data
 * @param options
 */
async function getGoogleHourlyData(options) {
  const {
    start_date, end_date, media_buyer, account_id
  } = options;
  const { rows } = await hourlyMediaBuyerGoogleCrossroads(
    start_date,
    end_date,
    media_buyer,
    null,
    account_id,
  );

  return processHourlyData(rows);
}

async function getFacebookCrossroadByDates({ start_date, end_date }) {
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);
  const { rows } = await facebookCrossroadsByDate(startDate, endDate);
  return processDateHoles(rows, startDate, endDate);
}

async function getGoogleCrossroadByDates({ start_date, end_date }) {
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);
  const { rows } = await googleCrossroadsByDate(startDate, endDate);
  return processDateHoles(rows, startDate, endDate);
}

async function getCampaignsFacebookCrossroads({ start_date, end_date, media_buyer, ad_account, q }) {
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);
  const { rows } = await campaignsFacebookCrossroads(startDate, endDate, media_buyer, ad_account, q);
  return rows;
}

async function getCampaignsGoogleCrossroads({ start_date, end_date, media_buyer, ad_account }) {
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);
  const { rows } = await campaignsGoogleCrossroads(startDate, endDate, media_buyer, ad_account);
  return rows;
}

module.exports = {
  getFacebookHourlyData,
  getGoogleHourlyData,
  getFacebookCrossroadByDates,
  getGoogleCrossroadByDates,
  getCampaignsFacebookCrossroads,
  getCampaignsGoogleCrossroads,
};
