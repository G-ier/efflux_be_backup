const db = require('../../../data/dbConfig');
const selects = require("../selects");


const tiktokCrossroadsByCampaignId = (campaign_id, startDate, endDate) => {
  const query = `
    WITH agg_cr AS (
      SELECT
        cr.request_date as cr_date,
        cr.adset_id,
        ${selects.CROSSROADS_PARTITIONED}
      FROM crossroads_partitioned cr
      WHERE    cr.request_date >  '${startDate}'
        AND    cr.request_date <= '${endDate}'
        AND    cr.campaign_id = '${campaign_id}'
      GROUP BY cr.request_date, cr.adset_id
  ), agg_tt AS (
      SELECT
        tt.date as tt_date,
        tt.adset_id,
        MAX(c.name) as campaign_name,
        MAX(ad.name) as account_name,
        ${selects.TIKTOK}
      FROM tiktok tt
        INNER JOIN campaigns c ON c.id = tt.campaign_id AND c.traffic_source = 'tiktok'
        INNER JOIN ad_accounts ad ON ad.id = c.ad_account_id
      WHERE tt.date >  '${startDate}'
        AND tt.date <= '${endDate}'
        AND tt.campaign_id = '${campaign_id}'
      GROUP BY tt.date, tt.adset_id
  ), agg_ttc AS (
    SELECT
      pb.adset_id,
      pb.date as pb_date,
      CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
      CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
      CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions
    FROM postback_events_partitioned pb
    WHERE    pb.date >  '${startDate}'
      AND    pb.date <= '${endDate}'
      AND    pb.campaign_id = '${campaign_id}'
    GROUP BY pb.adset_id, pb.date
  ), agg_adsets AS (
    SELECT MAX(adsets.provider_id) as adset_id,
           MAX(adsets.name) as adset_name,
           MAX(adsets.campaign_id) as campaign_id
    FROM adsets
    WHERE adsets.campaign_id = '${campaign_id}'
    GROUP BY adsets.provider_id
  )
  SELECT
    agg_tt.adset_id,
    MAX(agg_adsets.adset_name) as adset_name,
    MAX(agg_adsets.campaign_id) as campaign_id,
    ${selects.TIKTOK_CROSSROADS}
  FROM agg_cr
    FULL OUTER JOIN agg_tt ON agg_tt.adset_id = agg_cr.adset_id AND agg_tt.tt_date = agg_cr.cr_date
    FULL OUTER JOIN agg_ttc ON agg_ttc.adset_id = agg_cr.adset_id AND agg_tt.tt_date = agg_ttc.pb_date
    FULL OUTER JOIN agg_adsets ON agg_adsets.adset_id = agg_cr.adset_id
  GROUP BY agg_tt.adset_id;
  `;
  // console.log(query);
  return db.raw(query);
};

// async function main() {
//   const {rows} = await tiktokCrossroadsByCampaignId('1767363104091169', '2023-06-21', '2023-06-23')
//   console.log(rows.length)
// }

// main();
module.exports = tiktokCrossroadsByCampaignId;
