const db = require('../../data/dbConfig');
const selects = require("./selects");

function campaignsFacebookAMG(startDate, endDate, mediaBuyer, adAccount) {
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
            AND c.traffic_source = 'facebook'
            AND c.network = 'amg'
            ${mediaBuyerCondition}
            ${adAccountCondition}
        WHERE  amg.date >  '${startDate}'
          AND  amg.date <= '${endDate}'
        GROUP BY amg.campaign_id
      ), agg_fb AS (
          SELECT DISTINCT ON(fb.campaign_id) fb.campaign_id,
            MAX(c.name) as campaign_name,
            ${selects.FACEBOOK}
          FROM facebook fb
            INNER JOIN campaigns c ON fb.campaign_id = c.id
              AND c.traffic_source = 'facebook'
              AND c.network = 'amg'
              ${mediaBuyerCondition}
              ${adAccountCondition}
          WHERE  fb.date >  '${startDate}'
            AND  fb.date <= '${endDate}'
          GROUP BY fb.campaign_id
      )
      SELECT *
      FROM agg_fb
      FULL OUTER JOIN agg_amg ON agg_fb.campaign_id = agg_amg.campaign_id
      ORDER BY agg_fb.campaign_name ASC
  `);
}

module.exports = campaignsFacebookAMG;
