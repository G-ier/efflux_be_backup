const { GoogleAdsApi, enums } = require('google-ads-api');
const { add, removeAllOnDate } = require("../common/models");

const client = new GoogleAdsApi({
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  developer_token: process.env.GDN_DEVELOPER_TOKEN,
});

async function getAccessibleCustomers(refresh_token) {
  const accessibleCustomers = await client.listAccessibleCustomers(refresh_token)
  const customerIds = accessibleCustomers.resource_names.map(resource => resource.replace('customers/', ''));
  return customerIds;
}

async function getAdsReport(credentials, date_constant) {
  const { customer_id, refresh_token } = credentials;

  const customer = client.Customer({
    customer_id,
    refresh_token,
  });

  const segment_options = !date_constant ? {} : {
    segments: ["segments.date"],
    date_constant
  }

  const report = await customer.report({
    entity: "ad_group_ad",
    attributes: [
      "campaign.id",
      "campaign.name",
      "ad_group.id",
      "ad_group_ad.ad.id"
    ],
    metrics: [
      "metrics.ctr",
      "metrics.clicks",
      "metrics.cost_per_conversion",
      "metrics.average_cpc",
      "metrics.conversions",
    ],
    // constraints: {
    //   "campaign.status": enums.CampaignStatus.ENABLED,
    // },
    limit: 1000,
    ...segment_options,
  });

  const stats = report.map((item) => ({
    campaign_id: item.campaign.id,
    campaign_name: item.campaign.name,
    ad_group_id: item.ad_group.id,
    ad_id: item.ad_group_ad.ad.id,
    ...item.metrics
  }))

  return stats;
}

module.exports = {
  getAccessibleCustomers,
  getAdsReport,
}
