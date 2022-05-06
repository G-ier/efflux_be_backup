const db = require('../../data/dbConfig');
const selects = require("./selects");

function campaignsGoogleCrossroads(startDate, endDate, mediaBuyer, adAccount) {
  const mediaBuyerCondition = (mediaBuyer !== 'admin' && mediaBuyer)
    ? `AND user_id = ${mediaBuyer}`
    : '';

  const adAccountCondition = adAccount
    ? `AND ad_account_id = ${adAccount}`
    : '';

  return db.raw(`
      WITH agg_amg AS (
        SELECT DISTINCT ON(amg.campaign_id) amg.campaign_id,
          ${selects.AMG}
        FROM amg
          INNER JOIN campaigns c ON amg.campaign_id = c.id
            AND c.traffic_source = 'google'
            AND c.network = 'amg'
            ${mediaBuyerCondition}
            ${adAccountCondition}
        WHERE  amg.date >  '${startDate}'
          AND   amg.date <= '${endDate}'
        GROUP BY amg.campaign_id
      ), agg_google AS (
          SELECT DISTINCT ON(google.campaign_id) google.campaign_id,
          MAX(google.campaign_name) as campaign_name,
          ${selects.GOOGLE}
          FROM google_ads google
            INNER JOIN campaigns c ON google.campaign_id = c.id
                AND c.traffic_source = 'google'
                AND c.network = 'amg'
                ${mediaBuyerCondition}
                ${adAccountCondition}
          WHERE  google.date >  '${startDate}'
            AND  google.date <= '${endDate}'
          GROUP BY google.campaign_id
      )
      SELECT *
      FROM agg_google
      FULL OUTER JOIN agg_amg ON agg_google.campaign_id = agg_amg.campaign_id
      ORDER BY agg_google.campaign_name ASC
  `);
}

module.exports = campaignsGoogleCrossroads;
