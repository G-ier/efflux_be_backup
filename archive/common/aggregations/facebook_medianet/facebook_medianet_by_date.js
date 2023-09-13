const db = require('../../../../data/dbConfig');
const selects = require("../selects");

const facebookMediaNetByDate = (startDate, endDate) => {

  query = `
    WITH restriction AS (
      SELECT DISTINCT campaign_id
      FROM media_net_stats
      WHERE
        date > '${startDate}' AND date <= '${endDate}'
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
    ), agg_mn AS (
        SELECT
            date as mn_date,
            SUM(impressions) AS pbImpressions,
            SUM(total_clicks) AS total_clicks,
            SUM(estimated_revenue) AS revenue
        FROM
            media_net_stats
        WHERE
            date > '${startDate}' AND date <= '${endDate}'
        GROUP BY date
    ), agg_fb AS (
        SELECT
          fb.date as fb_date,
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
    )
    SELECT
        (CASE
            WHEN agg_fb.fb_date IS NOT null THEN agg_fb.fb_date
            WHEN agg_mn.mn_date IS NOT null THEN agg_mn.mn_date
            ELSE null
        END) as date,
        CAST(ROUND(SUM(agg_fb.spend)::decimal, 2) AS FLOAT) as spend,
        CAST(
          ROUND(
            SUM(agg_fb.nitido_spend * 1.02 + agg_fb.rebate_spend * 1.03 + agg_fb.inpulse_spend * inp.coefficient + agg_fb.own_spend
              )::decimal, 2
          )
        AS FLOAT) as spend_plus_fee,
        SUM(agg_mn.pbImpressions) as pbImpressions,
        SUM(agg_mn.total_clicks) as total_clicks,
        SUM(agg_mn.revenue) as revenue,
        CAST(SUM(agg_fb.fb_conversions) AS INTEGER) as fb_conversions,
        CAST(SUM(agg_fb.link_clicks) AS INTEGER) as link_clicks,
        CAST(SUM(agg_fb.impressions) AS INTEGER) as impressions
      FROM agg_mn
        INNER JOIN inpulse inp ON inp.coefficient_date = agg_mn.mn_date
        FULL OUTER JOIN agg_fb ON agg_fb.fb_date = agg_mn.mn_date
      GROUP BY agg_fb.fb_date, agg_mn.mn_date
      ORDER BY agg_mn.mn_date ASC;
  `;
  return db.raw(query);
}
module.exports = facebookMediaNetByDate;
