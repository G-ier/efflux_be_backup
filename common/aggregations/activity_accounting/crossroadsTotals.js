const db                    = require('../../../data/dbConfig');

function crossroadsTotals(startDate, endDate) {

  const query = `
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
      ),
      agg_cr AS (
          SELECT
            cr.request_date as date,
            SUM(CASE WHEN cr.traffic_source = 'facebook' THEN cr.total_revenue ELSE 0 END) as fb_revenue,
            SUM(CASE WHEN cr.traffic_source = 'tiktok' THEN cr.total_revenue ELSE 0 END) as tiktok_revenue,
            SUM(cr.total_revenue) as total_revenue
          FROM crossroads_partitioned cr
            WHERE  cr.request_date >  '${startDate}'
            AND   cr.request_date <= '${endDate}'
          GROUP BY  cr.request_date
      ),
      agg_fb AS (
          SELECT fb.date as fb_date,
          CAST(ROUND(SUM(fb.total_spent)::decimal, 2) AS FLOAT) as spend,
          CAST(ROUND(SUM(CASE WHEN ad.name LIKE '%Nitido%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as nitido_spend,
          CAST(ROUND(SUM(CASE WHEN ad.name LIKE '%Rebate%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as rebate_spend,
          CAST(ROUND(SUM(CASE WHEN ad.name LIKE '%INPULSE%' OR ad.name LIKE '%CSUY%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as inpulse_spend,
          CAST(
            ROUND(
              SUM(
                CASE WHEN ad.name NOT LIKE '%INPULSE%' AND ad.name NOT LIKE '%CSUY%' AND ad.name NOT LIKE '%Rebate%' AND ad.name NOT LIKE '%Nitido%' THEN fb.total_spent ELSE 0 END
              )::decimal, 2
            )
          AS FLOAT) as own_spend
          FROM facebook_partitioned fb
          INNER JOIN campaigns c ON c.id = fb.campaign_id AND c.traffic_source = 'facebook'
          INNER JOIN ad_accounts ad ON ad.id = c.ad_account_id
          WHERE  fb.date >  '${startDate}'
          AND  fb.date <= '${endDate}'
          GROUP BY fb.date
      ),
      agg_tiktok AS (
        SELECT
          tt.date as tt_date,
          CAST(ROUND(SUM(tt.total_spent)::decimal, 2) AS FLOAT) as spend
        FROM tiktok tt
          INNER JOIN campaigns c ON c.id = tt.campaign_id AND c.traffic_source = 'tiktok'
          INNER JOIN ad_accounts ad ON ad.id = c.ad_account_id
        WHERE tt.date >  '${startDate}'
          AND tt.date <= '${endDate}'
        GROUP BY tt.date
      )
      SELECT
        (CASE
            WHEN agg_fb.fb_date IS NOT null THEN agg_fb.fb_date
            WHEN agg_cr.date IS NOT null THEN agg_cr.date
            ELSE null
        END) as date,
        SUM(agg_cr.fb_revenue) as fb_revenue,
        SUM(agg_cr.tiktok_revenue) AS tiktok_revenue,
        SUM(agg_cr.total_revenue) AS total_revenue,
        SUM(agg_tiktok.spend) as tiktok_spend,
        SUM(agg_fb.spend) as fb_spend,
        CAST(
          ROUND(
            SUM(agg_fb.nitido_spend * 1.02 + agg_fb.rebate_spend * 1.03 + agg_fb.inpulse_spend * inp.coefficient + agg_fb.own_spend
              )::decimal, 2
          )
        AS FLOAT) as fb_spend_plus_fee
      FROM agg_cr
        INNER JOIN inpulse inp ON inp.coefficient_date = agg_cr.date
        FULL OUTER JOIN agg_fb ON agg_cr.date = agg_fb.fb_date
        FULL OUTER JOIN agg_tiktok ON agg_cr.date = agg_tiktok.tt_date
      GROUP BY agg_fb.fb_date, agg_cr.date
      ORDER BY agg_cr.date ASC
  `;
  // console.log(query)
  return db.raw(query)
}

const main = async () => {
  const { rows } = await crossroadsTotals('2023-06-26', '2023-07-04');
  console.log(rows)
}

// main();

module.exports = crossroadsTotals;
