const db = require('../../data/dbConfig');
const selects = require("./selects");

const dailyCampaignGoogleAMG = (campaign_id, start_date, end_date) => db.raw(`
    WITH agg_amg AS (
      SELECT DISTINCT ON(amg.date) amg.date,
        ${selects.AMG}
      FROM amg
      WHERE amg.date > '${start_date}'
            AND amg.date <= '${end_date}'
            AND amg.campaign_id = '${campaign_id}'
      GROUP BY amg.date
    ), agg_google AS (
        SELECT DISTINCT ON(google.date) google.date,
            ${selects.GOOGLE}
        FROM google_ads google
        WHERE
            google.date > '${start_date}'
            AND google.date <= '${end_date}'
            AND google.campaign_id = '${campaign_id}'
        GROUP BY google.date
    )
    SELECT *
    FROM agg_google FULL OUTER JOIN agg_amg USING (date)
    ORDER BY agg_google.date ASC
  `);

module.exports = dailyCampaignGoogleAMG;
