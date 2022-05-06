const db = require('../../data/dbConfig');
const selects = require("./selects");

const googleAMGByCampaignId = (campaign_id, startDate, endDate) => db.raw(`
    WITH agg_amg AS (
      SELECT DISTINCT ON(campaign_id) campaign_id,
        ${selects.AMG}
      FROM amg
      WHERE    amg.date >  '${startDate}'
          AND  amg.date <= '${endDate}'
          AND  amg.campaign_id = '${campaign_id}'
      GROUP BY amg.campaign_id
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
    SELECT * FROM agg_amg
      FULL OUTER JOIN agg_google USING (campaign_id)
  `);

module.exports = googleAMGByCampaignId;
