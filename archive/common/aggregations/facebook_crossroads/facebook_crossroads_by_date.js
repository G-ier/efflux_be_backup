const db = require("../../../../data/dbConfig");
const selects = require('../selects');

const facebookCrossroadsByDate = (startDate, endDate) => {

  `
  Summary:
    Gets the data from crossroads, facebook and postback_events tables
    queries by date and aggregates by date.

    If I'm quering the joint of traffic source, network and postbacks I have to put not condition on
    the traffic source, condition the networks on the traffic source and condition the postbacks on the network
    and traffic source.

  Params:
    startDate: the start date of the data
    endDate: the end date of the data
  Returns:
    the aggregated data for that timespan of the 3 tables
  `
  query = `
  WITH restriction AS (
    SELECT DISTINCT campaign_id
      FROM crossroads_partitioned
    WHERE
      request_date > '${startDate}' AND request_date <= '${endDate}'
    AND traffic_source = 'facebook'
  ), inpulse AS (
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
    MAX(cr.created_at) as cr_last_updated,
    ${selects.CROSSROADS_PARTITIONED}
    FROM crossroads_partitioned cr
      WHERE  cr.request_date >  '${startDate}'
      AND   cr.request_date <= '${endDate}'
      AND cr.traffic_source = 'facebook'
    GROUP BY  cr.request_date
  ), agg_fb AS (
      SELECT fb.date as fb_date,
      MAX(fb.created_at) as fb_last_updated,
      CAST(ROUND(SUM(CASE WHEN ad.name LIKE '%Nitido%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as nitido_spend,
      CAST(ROUND(SUM(CASE WHEN ad.name LIKE '%Rebate%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as rebate_spend,
      CAST(ROUND(SUM(CASE WHEN ad.name LIKE '%INPULSE%' OR ad.name LIKE '%CSUY%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as inpulse_spend,
      CAST(
        ROUND(
          SUM(
            CASE WHEN ad.name NOT LIKE '%INPULSE%' AND ad.name NOT LIKE '%CSUY%' AND ad.name NOT LIKE '%Rebate%' AND ad.name NOT LIKE '%Nitido%' THEN fb.total_spent ELSE 0 END
          )::decimal, 2
        )
      AS FLOAT) as own_spend,
      ${selects.FACEBOOK}
      FROM facebook_partitioned fb
      INNER JOIN campaigns c ON c.id = fb.campaign_id AND c.traffic_source = 'facebook'
      INNER JOIN ad_accounts ad ON ad.id = c.ad_account_id
      WHERE  fb.date >  '${startDate}'
      AND  fb.date <= '${endDate}'
      AND fb.campaign_id IN (SELECT campaign_id FROM restriction)
      GROUP BY fb.date
  ), agg_fbc AS (
        SELECT
          pb.date as fbc_date,
          CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
          CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
          CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions
          --TO_CHAR(CURRENT_TIMESTAMP, 'dd/HH24:MI (TZ)') as sheet_last_update
        FROM postback_events_partitioned pb
        WHERE pb.date > '${startDate}' AND pb.date <= '${endDate}'
        AND pb.traffic_source = 'facebook'
        AND pb.network = 'crossroads'
      GROUP BY pb.date
  )
  SELECT
    (CASE
        WHEN agg_fb.fb_date IS NOT null THEN agg_fb.fb_date
        WHEN agg_cr.date IS NOT null THEN agg_cr.date
        WHEN agg_fbc.fbc_date IS NOT null THEN agg_fbc.fbc_date
        ELSE null
    END) as date,
    MAX(fb_last_updated) as fb_last_updated,
    MAX(cr_last_updated) as cr_last_updated,
    CAST(
      ROUND(
        SUM(agg_fb.nitido_spend * 1.02 + agg_fb.rebate_spend * 1.03 + agg_fb.inpulse_spend * inp.coefficient + agg_fb.own_spend
          )::decimal, 2
      )
    AS FLOAT) as spend_plus_fee,
    ${selects.FACEBOOK_CROSSROADS}
  FROM agg_cr
    INNER JOIN inpulse inp ON inp.coefficient_date = agg_cr.date
    FULL OUTER JOIN agg_fb ON agg_cr.date = agg_fb.fb_date
    FULL OUTER JOIN agg_fbc on agg_fbc.fbc_date = agg_cr.date
  GROUP BY agg_fb.fb_date, agg_fbc.fbc_date, agg_cr.date
  ORDER BY agg_cr.date ASC
  `;
  return db.raw(query);
};

module.exports = facebookCrossroadsByDate;
