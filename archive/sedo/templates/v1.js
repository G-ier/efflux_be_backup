// Local Utils
const { isNotNumeric } = require("../../../src/shared/helpers/Utils");

const interpretDataWTemplateV1 = (insight, date) => {

  const domain = insight.domain[0]._;

  const funnel_id = insight.c1[0]?._ ? insight.c1[0]._ : '';

  let [campaign_id, adset_id, ad_id, traffic_source] = insight.c2[0]?._
    ? insight.c2[0]._.replace(' ', '').split('|')
    : ['Unkown', 'Unkown', 'Unkown', 'Unkown'];


  if (isNotNumeric(campaign_id)) campaign_id = 'Unkown';
  if (isNotNumeric(adset_id)) adset_id = 'Unkown';
  if (isNotNumeric(ad_id)) ad_id = 'Unkown';
  if (!['tiktok', 'facebook'].includes(traffic_source)) traffic_source = 'Unkown';

  const hit_id = insight.c3[0]?._ ? insight.c3[0]._ : '';

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
    funnel_id,
    hit_id,
    visitors,
    conversions,
    revenue: revenue,
    unique_identifier: `${campaign_id}-${adset_id}-${ad_id}-${date}`,
  };

}

module.exports = interpretDataWTemplateV1;
