const db = require("../../../data/dbConfig");
const selects = require('../selects');


const tiktokCrossroadsByDate = (startDate, endDate) => {

  query = `
  WITH restriction AS (
    SELECT DISTINCT campaign_id
      FROM crossroads_partitioned
    WHERE
      request_date > '${startDate}' AND request_date <= '${endDate}'
    AND traffic_source = 'tiktok'
  ), agg_cr AS (
    SELECT cr.request_date as date,
    MAX(cr.created_at) as cr_last_updated,
    ${selects.CROSSROADS_PARTITIONED}
    FROM crossroads_partitioned cr
      WHERE  cr.request_date >  '${startDate}'
      AND   cr.request_date <= '${endDate}'
      AND cr.traffic_source = 'tiktok'
    GROUP BY  cr.request_date
  ), agg_tt AS (
    SELECT
    tt.date as tt_date,
      ${selects.TIKTOK}
    FROM tiktok tt
      INNER JOIN campaigns c ON c.id = tt.campaign_id AND c.traffic_source = 'tiktok'
      INNER JOIN ad_accounts ad ON ad.id = c.ad_account_id
    WHERE tt.date >  '${startDate}'
      AND tt.date <= '${endDate}'
      AND tt.campaign_id IN (SELECT campaign_id FROM restriction)
    GROUP BY tt.date
  ), agg_ttc AS (
    SELECT
        pb.date as ttc_date,
        CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
        CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
        CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions
        --TO_CHAR(CURRENT_TIMESTAMP, 'dd/HH24:MI (TZ)') as sheet_last_update
      FROM postback_events_partitioned pb
      WHERE pb.date > '${startDate}' AND pb.date <= '${endDate}'
      AND pb.traffic_source = 'tiktok'
      AND pb.network = 'crossroads'
      AND pb.campaign_id IN (SELECT campaign_id FROM restriction)
    GROUP BY pb.date
  )
  SELECT
    (CASE
        WHEN agg_tt.tt_date IS NOT null THEN agg_tt.tt_date
        WHEN agg_cr.date IS NOT null THEN agg_cr.date
        WHEN agg_ttc.ttc_date IS NOT null THEN agg_ttc.ttc_date
        ELSE null
    END) as date,
    ${selects.TIKTOK_CROSSROADS}
  FROM agg_cr
    FULL OUTER JOIN agg_tt ON agg_cr.date = agg_tt.tt_date
    FULL OUTER JOIN agg_ttc on agg_ttc.ttc_date = agg_cr.date
    GROUP BY agg_tt.tt_date, agg_ttc.ttc_date, agg_cr.date
  ORDER BY agg_cr.date ASC
  `
  // console.log(query)
  return db.raw(query);
};

// async function main() {
//   const {rows} = await tiktokCrossroadsByDate('2023-06-21', '2023-06-23')
//   console.log(rows.length)
// }

// main();

module.exports = tiktokCrossroadsByDate;
