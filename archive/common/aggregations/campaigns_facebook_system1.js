const db = require('../../../data/dbConfig');
const selects = require("./selects");

function campaignsFacebookSystem1(startDate, endDate, mediaBuyer, adAccount) {
  const mediaBuyerCondition = (mediaBuyer !== 'admin' && mediaBuyer)
    ? `AND user_id = ${mediaBuyer}`
    : '';

  const adAccountCondition = adAccount
    ? `AND ad_account_id = ${adAccount}`
    : '';

  return db.raw(`
      WITH agg_s1 AS (
        SELECT s1.campaign_id,
          MAX(c.name) as campaign_name,
          ${selects.SYSTEM1}
        FROM system1_partitioned s1
          INNER JOIN campaigns c ON s1.campaign_id = c.id
            AND c.traffic_source = 'facebook'
            --AND c.network = 'system1'
            ${mediaBuyerCondition}
            ${adAccountCondition}
        WHERE  s1.date >  '${startDate}'
          AND   s1.date <= '${endDate}'
        GROUP BY s1.campaign_id
      ), agg_fb AS (
          SELECT fb.campaign_id,
            MAX(c.name) as campaign_name,
            ${selects.FACEBOOK}
          FROM facebook_partitioned fb
            INNER JOIN campaigns c ON fb.campaign_id = c.id
              AND c.traffic_source = 'facebook'
              --AND c.network = 'system1'
              ${mediaBuyerCondition}
              ${adAccountCondition}
          WHERE  fb.date >  '${startDate}'
            AND  fb.date <= '${endDate}'
          GROUP BY fb.campaign_id
      ), agg_pb_s1 AS (
          SELECT DISTINCT ON(pb_s1.campaign_id) pb_s1.campaign_id,
             ${selects.PB_SYSTEM1}
          FROM s1_conversions_partitioned as pb_s1
            INNER JOIN campaigns c ON pb_s1.campaign_id = c.id
                AND c.traffic_source = 'facebook'
                --AND c.network = 'system1'
                ${mediaBuyerCondition}
                ${adAccountCondition}
          WHERE pb_s1.date > '${startDate}' AND pb_s1.date <= '${endDate}'
          GROUP BY pb_s1.campaign_id
      )
      SELECT *
      FROM agg_s1
        INNER JOIN agg_fb USING(campaign_id, campaign_name)
        INNER JOIN agg_pb_s1 USING(campaign_id)
      ORDER BY agg_fb.campaign_name ASC
  `);
}

module.exports = campaignsFacebookSystem1;
