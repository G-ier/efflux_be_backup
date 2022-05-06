const db = require('../data/dbConfig');
const agg = require('../common/aggregations');
const { processDateHoles, processHourlyData } = require('../common/helpers');
const { yesterdayYMD, dayYMD } = require("../common/day");
const {get, deleteById} = require('../services/campaignsService');

const aggregations = {
  crossroads_facebook: {
    data: agg.facebookCrossroadsByCampaignId,
    dates: agg.dailyCampaignFacebookCrossroads,
    hours: agg.hourlyMediaBuyerFacebookCrossroads,
  },
  crossroads_google: {
    data: agg.googleCrossroadsByCampaignId,
    dates: agg.dailyCampaignGoogleCrossroads,
    hours: agg.hourlyGoogleCrossroadsByCampaignId,
  },
  amg_facebook: {
    data: agg.facebookAMGByCampaignId,
    dates: agg.dailyCampaignFacebookAMG,
    hours: agg.hourlyFacebookAMGByCampaignId,
  },
  amg_google: {
    data: agg.googleAMGByCampaignId,
    dates: agg.dailyCampaignGoogleAMG,
    hours: agg.hourlyGoogleAMGByCampaignId,
  },
  system1_facebook: {
    data: agg.facebookSystem1ByCampaignId,
    dates: agg.dailyCampaignFacebookSystem1,
    hours: agg.hourlyMediaBuyerFacebookSystem1,
  },
}

async function getCampaignAgg(id, media_buyer) {
  const where = { id };
  if (media_buyer && media_buyer !== 'admin') {
    where.user_id = media_buyer
  }
  const campaign = await db('campaigns').where(where).first();
  if (!campaign) {
    throw new Error(`Campaign ${id} not found`);
  }
  const { network, traffic_source } = campaign;
  const agg_key = [network, traffic_source].join('_');
  if (!aggregations[agg_key]) {
    throw new Error(`Unknown combination ${network} ${traffic_source}`)
  }

  return aggregations[agg_key];
}

async function getCampaignData(id, start_date, end_date, media_buyer) {
  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);
  const { data: getCampaignData } = await getCampaignAgg(id, media_buyer);
  const { rows } = await getCampaignData(id, startDate, endDate);
  return rows;
}

async function getCampaignDates(id, start_date, endDate, media_buyer) {
  const startDate = yesterdayYMD(start_date);
  const { dates: getCampaignDatesData } = await getCampaignAgg(id, media_buyer);
  const { rows } = await getCampaignDatesData(id, startDate, endDate);
  return processDateHoles(rows, startDate, endDate);
}

async function getCampaignHours(id, start_date, end_date, media_buyer) {
  const { hours: getCampaignHoursData } = await getCampaignAgg(id, media_buyer);
  const { rows } = await getCampaignHoursData(
    start_date,
    end_date,
    media_buyer,
    id
  );
  return processHourlyData(rows);
}

async function getCampaigns(query) {
  const { limit, page, orderBy, order } = query
  return  get(limit, page, orderBy, order)
}

async function deleteCampaign(id) {
  const result = await deleteById(id)
  if(result) return 'Campaign deleted successfully'
  throw new Error('Campaign not found')
}

module.exports = {
  getCampaignData,
  getCampaignDates,
  getCampaignHours,
  getCampaigns,
  deleteCampaign
}
