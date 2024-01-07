// Local Utils
const { isNotNumeric } = require("../../../shared/helpers/Utils");

const interpretDataWTemplateV2 = (insight, date) => {

    const domain = insight.domain[0]._;

    // Remove the temp_v2_ prefix from the sub3 string
    const sub3 = insight.c3[0]?._.replace('temp_v2_', '');

    const user_agent = insight.c1[0]?._ ? insight.c1[0]._ : 'Unknown';
    let [pixel_id, campaign_id, adset_id, ad_id, traffic_source, external] = insight.c2[0]?._ ? insight.c2[0]?._.split('_|_') : ['Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown'];
    let [ip, country_code, region, city, timestamp, campaign_name, session_id] = sub3 ? (sub3).split('_|_') : ['Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown', 'Unknown'];

    if (isNotNumeric(campaign_id)) campaign_id = 'Unknown';
    if (isNotNumeric(adset_id)) adset_id = 'Unknown';
    if (isNotNumeric(ad_id)) ad_id = 'Unknown';
    if (!['tiktok', 'facebook'].includes(traffic_source)) traffic_source = 'Unknown';

    const visitors = insight.uniques[0]._ ? parseInt(insight.uniques[0]._) : 0;
    const conversions = insight.clicks[0]._ ? parseInt(insight.clicks[0]._) : 0;
    const revenue = insight.earnings[0]._ ? parseFloat(insight.earnings[0]._) : 0;

    return {
      date,
      domain,
      traffic_source,
      campaign_id,
      adset_id,
      ad_id,
      campaign_name,
      visitors,
      revenue: revenue,
      unique_identifier: `${campaign_id}-${adset_id}-${ad_id}-${date}`,
      conversions,
    };
}

module.exports = interpretDataWTemplateV2;
