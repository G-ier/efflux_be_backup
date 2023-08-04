const db = require('../data/dbConfig');

const {
  hourlyMediaBuyerGoogleCrossroads,
  googleCrossroadsByDate,
  campaignsGoogleCrossroads,
  crossroadsTotalsByMediaBuyer,
  crossroadsTotals
} = require('../common/aggregations');
const { yesterdayYMD, dayYMD } = require('../common/day');
const { processDateHoles, processHourlyData } = require('../common/helpers');
const {
  dateAggregation,
  hourAggregation,
  campaignsAggregation,
  campaignsAggregationWithAdsets
}                                 = require('../insightQueries');

/**
 * @name getFacebookHourlyData
 * Returns facebook/crossroads hourly data
 * @param options
 */
async function getFacebookHourlyData(options) {
  const {
    start_date, end_date, media_buyer, account_id, q
  } = options;
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);
  const { rows } = await hourAggregation(
    startDate,
    endDate,
    'facebook',
    media_buyer,
    account_id,
    q,
  );
  return rows;

  return processHourlyData(rows);
}

async function getTiktokHourlyData(options) {
  const {
    start_date, end_date, media_buyer, account_id, q
  } = options;
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);
  const { rows } = await hourAggregation(
    startDate,
    endDate,
    'tiktok',
    media_buyer,
    account_id,
    q,
  );
  return rows;

  return processHourlyData(rows);
};

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

async function getFacebookCrossroadByDates({ start_date, end_date, media_buyer}) {
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);
  if (media_buyer === 'admin') media_buyer = null;
  const { rows } = await dateAggregation(startDate, endDate, 'facebook', media_buyer);
  return processDateHoles(rows, startDate, endDate);
}

async function getTiktokCrossroadsByDates({ start_date, end_date }) {
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);
  const { rows } = await dateAggregation(startDate, endDate, 'tiktok');
  return processDateHoles(rows, startDate, endDate);
};

async function getGoogleCrossroadByDates({ start_date, end_date }) {
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);
  const { rows } = await googleCrossroadsByDate(startDate, endDate);
  return processDateHoles(rows, startDate, endDate);
}

async function getCampaignsFacebookCrossroads({ start_date, end_date, media_buyer, ad_account, q }) {
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);
  const { rows } = await campaignsAggregationWithAdsets(startDate, endDate, 'facebook', media_buyer, ad_account, q);
  return rows;
}

async function getCampaignsTiktokCrossroads({ start_date, end_date, media_buyer, ad_account, q }) {
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);
  const { rows } = await campaignsAggregationWithAdsets(startDate, endDate, 'tiktok', media_buyer, ad_account, q);
  return rows;
}

async function getCampaignsGoogleCrossroads({ start_date, end_date, media_buyer, ad_account }) {
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);
  const { rows } = await campaignsGoogleCrossroads(startDate, endDate, media_buyer, ad_account);
  return rows;
}

async function getCrossroadsTotals({start_date, end_date}) {
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date) + " 23:59:59";
  console.log("Start Date", startDate)
  console.log("End Date", end_date)
  const { rows } = await crossroadsTotals(startDate, end_date);
  return rows;
}

async function getCrossroadsTotalsByMediaBuyer({start_date, end_date, media_buyer}) {
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date) + " 23:59:59";
  const mediaBuyer = media_buyer !== 'undefined' ? media_buyer : null;
  console.log("Start Date", startDate)
  console.log("End Date", end_date)
  console.log("Get Crossroads Totals By Media Buyer", mediaBuyer)
  const { rows } = await crossroadsTotalsByMediaBuyer(startDate, end_date, mediaBuyer);
  return rows;
}

module.exports = {
  getFacebookHourlyData,
  getGoogleHourlyData,
  getFacebookCrossroadByDates,
  getGoogleCrossroadByDates,
  getCampaignsFacebookCrossroads,
  getCampaignsGoogleCrossroads,
  getCampaignsTiktokCrossroads,
  getTiktokHourlyData,
  getTiktokCrossroadsByDates,
  getCrossroadsTotals,
  getCrossroadsTotalsByMediaBuyer
};
