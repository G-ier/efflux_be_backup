const { crossroadsCampaigns, crossroadsAdsets } = require('./crossroads_campaigns');
const crossroadsByDateAndCampaign = require('./crossroads_by_date_campaigns');
const aggregateConversionReport = require('./conversion_report');
const aggregatePostbackConversionByTrafficReport = require('./aggregate_postback_conversion_by_traffic_report');
const hourlyMediaBuyerFacebookCrossroads = require('./facebook_crossroads/hourly_media_buyer_facebook_crossroads');
const hourlyMediaBuyerGoogleCrossroads = require('./hourly_media_buyer_google_crossroads');
const dailyCampaignFacebookCrossroads = require('./facebook_crossroads/daily_campaign_facebook_crossroads');
const dailyCampaignGoogleCrossroads = require('./daily_campaign_google_crossroads');
const facebookByDate = require('./facebook_by_date');
const googleByDate = require('./google_by_date');
const facebookCrossroadsByDate = require('./facebook_crossroads/facebook_crossroads_by_date');
const googleCrossroadsByDate = require('./google_crossroad_by_date');
const clicksReport = require('./clicks_report');
const campaignsFacebookCrossroads = require('./facebook_crossroads/campaigns_facebook_crossroads');
const campaignsGoogleCrossroads = require('./campaigns_google_crossroads');
const hourlyGoogleCrossroadsByCampaignId = require('./hourly_google_crossroads_by_campaign');
const facebookCrossroadsByCampaignId = require('./facebook_crossroads/facebook_crossroads_by_campaign');
const googleCrossroadsByCampaignId = require('./google_crossroads_by_campaign');
const amgByDate = require('./amg_by_date');
const aggregateAMGConversions = require('./amg_conversion_report');
const aggregateCRConversions = require('./cr_conversion_report');
const googleAMGByDate = require('./google_amg_by_date');
const googleAMGByCampaignId = require('./google_amg_by_campaign');
const facebookAMGByDate = require('./facebook_amg_by_date');
const facebookAMGByCampaignId = require('./facebook_amg_by_campaign');
const campaignsGoogleAMG = require('./campaigns_google_amg');
const campaignsFacebookAMG = require('./campaigns_facebook_amg');
const hourlyGoogleAMGByCampaignId = require('./hourly_google_amg_by_campaign');
const hourlyFacebookAMGByCampaignId = require('./hourly_facebook_amg_by_campaign');
const hourlyMediaBuyerGoogleAMG = require('./hourly_media_buyer_google_amg');
const hourlyMediaBuyerFacebookAMG = require('./hourly_media_buyer_facebook_amg');
const dailyCampaignFacebookAMG = require('./daily_campaign_facebook_amg');
const dailyCampaignGoogleAMG = require('./daily_campaign_google_amg');
const aggregatePRConversionReport = require('./pr_conversion_report');
const aggregateSystem1ConversionReport = require('./system1_conversion_report');
const aggregatePostbackConversionReport = require('./postback_conversion_report');
const aggregateSedoConversionReport = require('./sedo_conversion_report');
const dailyCampaignFacebookSystem1 = require('./daily_campaign_facebook_system1');
const hourlyMediaBuyerFacebookSystem1 = require('./hourly_media_buyer_facebook_system1');
const hourlyFacebookSystem1ByCampaignId = require('./hourly_facebook_system1_by_campaign');
const campaignsFacebookSystem1 = require('./campaigns_facebook_system1');
const facebookSystem1ByDate = require('./facebook_system1_by_date');
const facebookSystem1ByCampaignId = require('./facebook_system1_by_campaign');
const aggregateOBConversionReport = require('./ob_conversion_report');
const aggregatePBUnknownConversionReport = require('./pb_unknown_conversion_report');
const aggregateFacebookAdsTodaySpentReport = require('./facebook_total_spent_by_date');
const aggregateCampaignConversionReport = require('./campaign_conversion_report');

module.exports = {
  crossroadsCampaigns,
  crossroadsAdsets,
  aggregateConversionReport,
  aggregateAMGConversions,
  aggregateCRConversions,
  crossroadsByDateAndCampaign,
  hourlyMediaBuyerFacebookCrossroads,
  hourlyMediaBuyerGoogleCrossroads,
  dailyCampaignFacebookCrossroads,
  dailyCampaignGoogleCrossroads,
  facebookByDate,
  googleByDate,
  facebookCrossroadsByDate,
  googleCrossroadsByDate,
  clicksReport,
  campaignsFacebookCrossroads,
  campaignsGoogleCrossroads,
  hourlyGoogleCrossroadsByCampaignId,
  facebookCrossroadsByCampaignId,
  googleCrossroadsByCampaignId,
  amgByDate,
  googleAMGByDate,
  googleAMGByCampaignId,
  facebookAMGByDate,
  facebookAMGByCampaignId,
  campaignsGoogleAMG,
  campaignsFacebookAMG,
  hourlyGoogleAMGByCampaignId,
  hourlyFacebookAMGByCampaignId,
  hourlyMediaBuyerGoogleAMG,
  hourlyMediaBuyerFacebookAMG,
  dailyCampaignFacebookAMG,
  dailyCampaignGoogleAMG,
  aggregatePRConversionReport,
  aggregateSystem1ConversionReport,
  aggregatePostbackConversionReport,
  aggregatePostbackConversionByTrafficReport,
  aggregateSedoConversionReport,
  aggregatePBUnknownConversionReport,
  dailyCampaignFacebookSystem1,
  hourlyMediaBuyerFacebookSystem1,
  hourlyFacebookSystem1ByCampaignId,
  campaignsFacebookSystem1,
  facebookSystem1ByDate,
  facebookSystem1ByCampaignId,
  aggregateOBConversionReport,
  aggregateFacebookAdsTodaySpentReport,
  aggregateCampaignConversionReport
};
