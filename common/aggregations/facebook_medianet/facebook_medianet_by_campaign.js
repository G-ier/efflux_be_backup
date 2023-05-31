const db = require('../../../data/dbConfig');
const selects = require("../selects");

const facebookMedianetByCampaignId = (campaign_id, startDate, endDate) => {
  query = `
      WITH agg_mn AS (
        SELECT
            adset_id,
            SUM(impressions) AS total_impressions,
            SUM(total_clicks) AS total_clicks,
            SUM(estimated_revenue) AS total_revenue
        FROM
            media_net_stats
        WHERE
            date > '${startDate}' AND date <= '${endDate}'
        AND
            campaign_id = '${campaign_id}'
        GROUP BY
            adset_id
    ), agg_fb AS (
        SELECT fb.adset_id,
          MAX(fb.campaign_name) as campaign_name,
          ${selects.FACEBOOK}
        FROM facebook_partitioned fb
        WHERE  fb.date >  '${startDate}'
        AND  fb.date <= '${endDate}'
        AND fb.campaign_id = '${campaign_id}'
        GROUP BY fb.adset_id
    ), agg_adsets AS (
          SELECT MAX(adsets.provider_id) as adset_id,
                MAX(adsets.name) as adset_name,
                MAX(adsets.campaign_id) as campaign_id
          FROM adsets
          WHERE adsets.campaign_id = '${campaign_id}'
          GROUP BY adsets.provider_id
    )
    SELECT *
    FROM agg_mn
      FULL OUTER JOIN agg_fb USING(adset_id)
      FULL OUTER JOIN agg_adsets USING (adset_id);
  `
  return db.raw(query);
}

module.exports = facebookMedianetByCampaignId;
