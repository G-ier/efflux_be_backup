const db = require('../../../data/dbConfig');
const selects = require("../selects");

function campaignsFacebookCrossroads(startDate, endDate, mediaBuyer, adAccount, q) {
  const mediaBuyerCondition = (mediaBuyer !== 'admin' && mediaBuyer)
    ? `AND user_id = ${mediaBuyer}`
    : '';

  const adAccountCondition = adAccount
    ? `AND c.ad_account_id = ${adAccount}`
    : '';

  const queryCondition = q
    ? `AND c.name ILIKE '%${q}%'`
    : '';

  return db.raw(`
      WITH agg_cr AS (
        SELECT cr.campaign_id,
            ${selects.CROSSROADS}
        FROM crossroads_stats cr
          INNER JOIN campaigns c ON cr.campaign_id = c.id
            AND c.traffic_source = 'facebook'
            AND c.network = 'crossroads'
            ${mediaBuyerCondition}
            ${adAccountCondition}
            ${queryCondition}
        WHERE  cr.request_date >  '${startDate}'
          AND   cr.request_date <= '${endDate}'
        GROUP BY cr.campaign_id
      ), agg_fb AS (
          SELECT fb.campaign_id,
            MAX(c.name) as campaign_name,
            ${selects.FACEBOOK}
          FROM facebook fb
            INNER JOIN campaigns c ON fb.campaign_id = c.id
              AND c.traffic_source = 'facebook'
              AND c.network = 'crossroads'
              ${mediaBuyerCondition}
              ${adAccountCondition}
              ${queryCondition}
          WHERE  fb.date >  '${startDate}'
            AND  fb.date <= '${endDate}'
          GROUP BY fb.campaign_id
      ), agg_fbc AS (
          SELECT fbc.campaign_id,
            ${selects.FACEBOOK_CONVERSIONS}
          FROM fb_conversions as fbc
            INNER JOIN campaigns c ON fbc.campaign_id = c.id
                AND c.network = 'crossroads'
                AND c.traffic_source = 'facebook'
                ${mediaBuyerCondition}
                ${adAccountCondition}
                ${queryCondition}
          WHERE fbc.date > '${startDate}' AND fbc.date <= '${endDate}'
          GROUP BY fbc.campaign_id
      )
      SELECT *
      FROM agg_fb
        FULL OUTER JOIN agg_cr USING(campaign_id)
        FULL OUTER JOIN agg_fbc USING(campaign_id)
      ORDER BY agg_fb.campaign_name ASC
  `);
}

module.exports = campaignsFacebookCrossroads;
