const db = require('../../data/dbConfig');
const selects = require("./selects");

const dailyCampaignFacebookAMG = (campaign_id, start_date, end_date) => db.raw(`
    WITH agg_amg AS (
      SELECT DISTINCT ON(amg.date) amg.date,
        ${selects.AMG}
      FROM amg
      WHERE amg.date > '${start_date}'
        AND amg.date <= '${end_date}'
        AND amg.campaign_id = '${campaign_id}'
      GROUP BY amg.date
    ), agg_fb AS (
      SELECT DISTINCT ON(fb.date) fb.date,
        ${selects.FACEBOOK}
      FROM facebook fb
      WHERE
        fb.date > '${start_date}'
        AND fb.date <= '${end_date}'
        AND fb.campaign_id = '${campaign_id}'
      GROUP BY fb.date
    )
    SELECT * FROM agg_amg
      FULL OUTER JOIN agg_fb USING (date)
    ORDER BY agg_fb.date ASC
  `);

module.exports = dailyCampaignFacebookAMG;
