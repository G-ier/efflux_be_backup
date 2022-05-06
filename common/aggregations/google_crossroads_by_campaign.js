const db = require('../../data/dbConfig');
const selects = require("./selects");

const googleCrossroadsByCampaignId = (campaign_id, startDate, endDate) => db.raw(`
    WITH agg_cr AS (
      SELECT DISTINCT ON(campaign_id) campaign_id,
        ${selects.CROSSROADS}
      FROM crossroads cr
      WHERE     cr.date >  '${startDate}'
          AND   cr.date <= '${endDate}'
          AND   cr.campaign_id = '${campaign_id}'
      GROUP BY cr.campaign_id
    ), agg_google AS (
        SELECT DISTINCT ON(google.campaign_id) google.campaign_id,
            MAX(google.campaign_name) as campaign_name,
            ${selects.GOOGLE}
        FROM google_ads google
        WHERE       google.date >  '${startDate}'
            AND     google.date <= '${endDate}'
            AND     google.campaign_id = '${campaign_id}'
        GROUP BY google.campaign_id
    )
    SELECT * FROM agg_cr
      FULL OUTER JOIN agg_google USING (campaign_id)
  `);

module.exports = googleCrossroadsByCampaignId;
