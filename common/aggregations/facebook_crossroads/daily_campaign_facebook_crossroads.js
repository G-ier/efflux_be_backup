const db = require('../../../data/dbConfig');
const selects = require("../selects");

const dailyCampaignFacebookCrossroads = (campaign_id, startDate, endDate) => {

  `
  Summary:
    Gets the data from crossroads, facebook and postback_events tables for a specific campaign
    queries by campaign_id and date and aggregates it by date.

  Params:
    campaign_id: the campaign id
    startDate: the start date of the data
    endDate: the end date of the data
  Returns:
    the aggregated data for that timespan of the 3 tables
    for a specific campaign
    for a timespan
  `

  query = `
  WITH inpulse AS (
    SELECT
      fb.date as coefficient_date,
      CASE
        WHEN SUM(fb.total_spent) >= 0 AND SUM(fb.total_spent) < 1500 THEN 1.1
        WHEN SUM(fb.total_spent) >= 1500 AND SUM(fb.total_spent) < 3000 THEN 1.08
        WHEN SUM(fb.total_spent) >= 3000 AND SUM(fb.total_spent) < 6000 THEN 1.06
        WHEN SUM(fb.total_spent) >= 6000 AND SUM(fb.total_spent) < 10000 THEN 1.04
        ELSE 1.04
      END as coefficient
    FROM facebook_partitioned fb
    INNER JOIN ad_accounts ad ON ad.fb_account_id = fb.ad_account_id
    WHERE  fb.date >  '${startDate}'
    AND  fb.date <= '${endDate}'
    AND (ad.name LIKE '%INPULSE%' OR ad.name LIKE '%CSUY%')
    GROUP BY fb.date
  ), agg_cr AS (
    SELECT cr.request_date as date,
      ${selects.CROSSROADS_PARTITIONED}
    FROM crossroads_partitioned cr
    WHERE cr.request_date > '${startDate}'
      AND cr.request_date <= '${endDate}'
      AND cr.campaign_id = '${campaign_id}'
    GROUP BY cr.request_date
  ), agg_fb AS (
    SELECT
      fb.date as fb_date,
      CAST(ROUND(SUM(CASE WHEN ad.name LIKE '%Nitido%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as nitido_spend,
      CAST(ROUND(SUM(CASE WHEN ad.name LIKE '%Rebate%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as rebate_spend,
      CAST(ROUND(SUM(CASE WHEN ad.name LIKE '%INPULSE%' OR ad.name LIKE '%CSUY%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as inpulse_spend,
      CAST(ROUND(SUM(CASE WHEN ad.name NOT LIKE '%INPULSE%' AND ad.name NOT LIKE '%CSUY%' AND ad.name NOT LIKE '%Rebate%' AND ad.name NOT LIKE '%Nitido%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as own_spend,
      ${selects.FACEBOOK}
    FROM facebook_partitioned fb
    INNER JOIN campaigns c ON c.id = fb.campaign_id AND c.traffic_source = 'facebook'
    INNER JOIN ad_accounts ad ON ad.id = c.ad_account_id
    WHERE
      fb.date > '${startDate}'
      AND fb.date <= '${endDate}'
      AND fb.campaign_id = '${campaign_id}'
    GROUP BY fb.date
  ), agg_fbc AS (
    SELECT
        pb.date as fbc_date,
        CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
        CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
        CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions
        --TO_CHAR(CURRENT_TIMESTAMP, 'dd/HH24:MI (TZ)') as sheet_last_update
        FROM postback_events_partitioned pb
        WHERE    pb.date >  '${startDate}'
          AND    pb.date <= '${endDate}'
          AND    pb.campaign_id = '${campaign_id}'
        GROUP BY pb.date
    )
  SELECT
    inp.coefficient_date as date,
    CAST(ROUND((agg_fb.nitido_spend * 1.02 + agg_fb.rebate_spend * 1.03 + inpulse_spend * inp.coefficient + own_spend)::decimal, 2) AS FLOAT) AS spend_plus_fee,
    agg_cr.*,
    agg_fb.*,
    agg_fbc.*
  FROM agg_cr
    FULL OUTER JOIN agg_fb ON agg_cr.date = agg_fb.fb_date
    FULL OUTER JOIN agg_fbc on agg_fbc.fbc_date = agg_cr.date
    FULL OUTER JOIN inpulse inp ON inp.coefficient_date = agg_fb.fb_date
  ORDER BY agg_fb.fb_date ASC
  `
  console.log(query)
  return db.raw(query);

}

async function main() {
  const {rows} = await dailyCampaignFacebookCrossroads('23854270496050582', '2023-05-26', '2023-06-02')
  console.log(rows.length)
}

main();

module.exports = dailyCampaignFacebookCrossroads;
