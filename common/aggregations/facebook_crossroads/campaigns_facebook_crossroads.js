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

  let query = `
  WITH agg_cr AS (
    SELECT cr.campaign_id,
        ${selects.CROSSROADS_PARTITIONED}
    FROM crossroads_partitioned cr
      INNER JOIN campaigns c ON cr.campaign_id = c.id
        AND c.traffic_source = 'facebook'
        --AND c.network = 'crossroads'
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
      FROM facebook_partitioned fb
        INNER JOIN campaigns c ON fb.campaign_id = c.id
          AND c.traffic_source = 'facebook'
          --AND c.network = 'crossroads'
          ${mediaBuyerCondition}
          ${adAccountCondition}
          ${queryCondition}
      WHERE  fb.date >  '${startDate}'
        AND  fb.date <= '${endDate}'
      GROUP BY fb.campaign_id
  ), agg_fbc AS (
      SELECT pb.campaign_id,
      CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions,
      CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
      CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
        MAX(pb.updated_at) as last_updated,
        CAST(COUNT(distinct (CASE WHEN pb.event_type = 'lead' THEN fbclid END)) AS INTEGER) as pb_uniq_conversions
      FROM postback_events_partitioned as pb
          INNER JOIN campaigns c ON pb.campaign_id = c.id
          AND c.traffic_source = 'facebook'
          --AND c.network = 'crossroads'
            ${mediaBuyerCondition}
            ${adAccountCondition}
            ${queryCondition}
      WHERE pb.date > '${startDate}' AND pb.date <= '${endDate}'
      GROUP BY pb.campaign_id
  )
  SELECT agg_cr.conversions as cr_conversions, agg_fb.*, agg_fbc.*, agg_cr.*
  FROM agg_fb
    FULL OUTER JOIN agg_cr USING(campaign_id)
    FULL OUTER JOIN agg_fbc USING(campaign_id)
  ORDER BY agg_fb.campaign_name ASC
  `;
  return db.raw(query);

}

module.exports = campaignsFacebookCrossroads;
