const db = require('../../../../data/dbConfig');
const selects = require("../selects");


function hourlyMediaBuyerTiktokCrossroads(start_date, end_date, mediaBuyer, campaignId, adAccountId, q) {
  const campaignIDCondition = campaignId
    ? `AND campaign_id = '${campaignId}'`
    : '';

  const mediaBuyerCondition = (mediaBuyer !== 'admin' && mediaBuyer)
    ? `AND user_id = ${mediaBuyer}`
    : '';

  const adAccountIdCondition = adAccountId
    ? `AND c.ad_account_id = ${adAccountId}`
    : '';

  const queryCondition = q
    ? `AND c.name iLike '%${q}%'`
    : '';

  const startDate = start_date;
  const endDate = end_date;

  const query = `
    WITH restriction AS (
      SELECT DISTINCT campaign_id
        FROM crossroads_partitioned
      WHERE
        request_date > '${startDate}' AND request_date <= '${endDate}'
      AND traffic_source = 'tiktok'
  ), agg_cr AS (
    SELECT
      cr.hour as cr_hour,
      ${selects.CROSSROADS_PARTITIONED}
    FROM crossroads_partitioned cr
    ${
      (mediaBuyerCondition !== '' || adAccountIdCondition !== '' || queryCondition !== '')
        ? `INNER JOIN campaigns c ON cr.campaign_id = c.id`
        : ''
    }
      ${mediaBuyerCondition}
      ${adAccountIdCondition}
      ${queryCondition}
    WHERE  cr.request_date >  '${startDate}'
      AND  cr.request_date <= '${endDate}'
      AND  cr.traffic_source = 'tiktok'
      ${campaignIDCondition}
    GROUP BY  cr.hour
  ), agg_tt AS (
    SELECT
      tt.hour as tt_hour,
      ${selects.TIKTOK}
    FROM tiktok tt
    INNER JOIN campaigns c ON c.id = tt.campaign_id AND c.traffic_source = 'tiktok'
      ${mediaBuyerCondition}
      ${adAccountIdCondition}
      ${queryCondition}
    INNER JOIN ad_accounts ad ON ad.id = c.ad_account_id
    WHERE tt.date >  '${startDate}'
      AND tt.date <= '${endDate}'
      AND tt.campaign_id IN (SELECT campaign_id FROM restriction)
      ${campaignIDCondition}
    GROUP BY tt.hour
  ), agg_ttc AS (
    SELECT
      pb.hour as ttc_hour,
      CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions,
      CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
      CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
      MAX(pb.updated_at) as last_updated,
      CAST(COUNT(distinct (CASE WHEN pb.event_type = 'lead' THEN fbclid END)) AS INTEGER) as pb_uniq_conversions
    FROM postback_events_partitioned pb
      ${
        (mediaBuyerCondition !== '' || adAccountIdCondition !== '' || queryCondition !== '')
          ? `INNER JOIN campaigns c ON pb.campaign_id = c.id`
          : ''
      }
        ${mediaBuyerCondition}
        ${adAccountIdCondition}
        ${queryCondition}
    WHERE  pb.date >  '${startDate}'
      AND  pb.date <= '${endDate}'
      AND pb.traffic_source = 'tiktok'
      AND pb.network = 'crossroads'
      ${campaignIDCondition}
    GROUP BY pb.hour
  )
  SELECT
    agg_cr.cr_hour as hour,
      ${selects.TIKTOK_CROSSROADS}
  FROM agg_cr
    FULL OUTER JOIN agg_tt ON agg_cr.cr_hour = agg_tt.tt_hour
    FULL OUTER JOIN agg_ttc ON agg_cr.cr_hour = agg_ttc.ttc_hour
  GROUP BY agg_cr.cr_hour
  `
  // console.log(query);
  return db.raw(query);

};

// async function main() {
//   const {rows} = await hourlyMediaBuyerTiktokCrossroads('2023-06-21', '2023-06-23')
//   console.log(rows.length)
// }

// main();

module.exports = hourlyMediaBuyerTiktokCrossroads;
