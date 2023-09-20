const db = require('../../../../data/dbConfig');
const selects = require("../selects");

function campaignsTiktokCrossroads(startDate, endDate, mediaBuyer, adAccount, q) {

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
    WITH restriction AS (
      SELECT DISTINCT campaign_id
        FROM crossroads_partitioned
      WHERE
        request_date > '${startDate}' AND request_date <= '${endDate}'
      AND traffic_source = 'tiktok'
    ), agg_cr AS (
      SELECT
        cr.campaign_id,
          ${selects.CROSSROADS_PARTITIONED}
      FROM crossroads_partitioned cr
      ${
        (mediaBuyerCondition !== '' || adAccountCondition !== '' || queryCondition !== '')
          ? `INNER JOIN campaigns c ON cr.campaign_id = c.id`
          : ''
      }
          ${mediaBuyerCondition}
          ${adAccountCondition}
          ${queryCondition}
      WHERE cr.request_date >  '${startDate}'
        AND cr.request_date <= '${endDate}'
        AND cr.traffic_source = 'tiktok'
      GROUP BY cr.campaign_id
    ), agg_tt AS (
      SELECT
          tt.campaign_id,
          MAX(c.name) as campaign_name,
          MAX(ad.name) as account_name,
          MAX(tt.updated_at) as last_updated,
          ${selects.TIKTOK}
      FROM tiktok tt
      INNER JOIN campaigns c ON c.id = tt.campaign_id AND c.traffic_source = 'tiktok'
        ${mediaBuyerCondition}
        ${adAccountCondition}
        ${queryCondition}
      INNER JOIN ad_accounts ad ON ad.id = c.ad_account_id
      WHERE tt.date >  '${startDate}'
        AND tt.date <= '${endDate}'
        AND tt.campaign_id IN (SELECT campaign_id FROM restriction)
      GROUP BY tt.campaign_id
    ), agg_ttc AS (
      SELECT
      pb.campaign_id,
      CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions,
      CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
      CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
        MAX(pb.updated_at) as last_updated,
        CAST(COUNT(distinct (CASE WHEN pb.event_type = 'lead' THEN fbclid END)) AS INTEGER) as pb_uniq_conversions
      FROM postback_events_partitioned as pb
      ${
        (mediaBuyerCondition !== '' || adAccountCondition !== '' || queryCondition !== '')
          ? `INNER JOIN campaigns c ON pb.campaign_id = c.id`
          : ''
      }
          ${mediaBuyerCondition}
          ${adAccountCondition}
          ${queryCondition}
      WHERE pb.date > '${startDate}' AND pb.date <= '${endDate}'
      AND pb.traffic_source = 'tiktok'
      GROUP BY pb.campaign_id
    )
    SELECT
      agg_tt.campaign_id,
      MAX(agg_tt.campaign_name) as campaign_name,
      MAX(agg_tt.account_name) as account_name,
      ${selects.TIKTOK_CROSSROADS}
    FROM agg_tt
      FULL OUTER JOIN agg_cr ON agg_tt.campaign_id = agg_cr.campaign_id
      FULL OUTER JOIN agg_ttc ON agg_tt.campaign_id = agg_ttc.campaign_id
    GROUP BY agg_tt.campaign_id;
    `
    // console.log(query)
    return db.raw(query)
}

// async function main() {
//   const {rows} = await campaignsTiktokCrossroads('2023-06-21', '2023-06-23', null, null, null)
//   console.log(rows.length)
// }

// main()

module.exports = campaignsTiktokCrossroads;
