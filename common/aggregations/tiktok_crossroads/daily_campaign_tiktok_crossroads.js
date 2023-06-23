const db = require('../../../data/dbConfig');
const selects = require("../selects");

const dailyCampaignsTiktokCrossroads = (campaign_id, startDate, endDate) => {

    let query = `
    WITH agg_cr AS (
        SELECT cr.request_date as date,
          ${selects.CROSSROADS_PARTITIONED}
          FROM crossroads_partitioned cr
          WHERE cr.request_date > '${startDate}'
            AND cr.request_date <= '${endDate}'
            AND cr.campaign_id = '${campaign_id}'
          GROUP BY cr.request_date
    ), agg_tt AS (
      SELECT
        tt.date as tt_date,
          ${selects.TIKTOK}
      FROM tiktok tt
      INNER JOIN campaigns c ON c.id = tt.campaign_id AND c.traffic_source = 'tiktok'
      INNER JOIN ad_accounts ad ON ad.id = c.ad_account_id
      WHERE tt.date >  '${startDate}'
        AND tt.date <= '${endDate}'
        AND tt.campaign_id = '${campaign_id}'
      GROUP BY tt.date
    ), agg_ttc AS (
      SELECT
      pb.date as ttc_date,
      CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions,
      CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
      CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
        MAX(pb.updated_at) as last_updated,
        CAST(COUNT(distinct (CASE WHEN pb.event_type = 'lead' THEN fbclid END)) AS INTEGER) as pb_uniq_conversions
      FROM postback_events_partitioned pb
        WHERE    pb.date >  '${startDate}'
          AND    pb.date <= '${endDate}'
          AND    pb.campaign_id = '${campaign_id}'
      GROUP BY pb.date
    )
    SELECT
      agg_tt.spend as spend_plus_fee,
      agg_cr.*,
      agg_tt.*,
      agg_ttc.*
    FROM agg_cr
      FULL OUTER JOIN agg_tt ON agg_cr.date = agg_tt.tt_date
      FULL OUTER JOIN agg_ttc on agg_ttc.ttc_date = agg_cr.date
    ORDER BY agg_tt.tt_date ASC
    `
    // console.log(query)
    return db.raw(query);
}

// async function main() {
//   const {rows} = await dailyCampaignsTiktokCrossroads('1767363104091169', '2023-06-21', '2023-06-23')
//   console.log(rows.length)
// }

// main();

module.exports = dailyCampaignsTiktokCrossroads;
