const db = require('../../data/dbConfig');
const selects = require("./selects");

const dailyCampaignGoogleCrossroads = (campaign_id, start_date, end_date) => db.raw(`
    WITH agg_cr AS (
      SELECT DISTINCT ON(cr.date) cr.date,
        ${selects.CROSSROADS}
      FROM crossroads cr
      WHERE cr.date > '${start_date}'
            AND cr.date <= '${end_date}'
            AND cr.campaign_id = '${campaign_id}'
      GROUP BY cr.date
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
    FROM agg_google FULL OUTER JOIN agg_cr USING (date)
    ORDER BY agg_google.date ASC
  `);

module.exports = dailyCampaignGoogleCrossroads;
