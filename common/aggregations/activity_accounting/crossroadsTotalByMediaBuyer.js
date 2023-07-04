const db                    = require('../../../data/dbConfig');


function crossroadsTotalsByMediaBuyer(startDate, endDate, media_buyer) {

  const mediaBuyer = media_buyer !== 'undefined' ? media_buyer : null;
  const mediaBuyerCondition = mediaBuyer
  ? `AND u.id = ${mediaBuyer}`
  : '';

  let query = `
    WITH total_spends AS (
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
      agg_fb AS (
          SELECT
              fb.date as fb_date,
              COALESCE(TRIM(LOWER(u.name)), 'unknown') AS media_buyer,
              ad.name as account_name,
              CAST(ROUND(SUM(fb.total_spent)::decimal, 2) AS FLOAT) as spend
          FROM facebook_partitioned fb
            INNER JOIN campaigns c ON c.id = fb.campaign_id AND c.traffic_source = 'facebook'
            INNER JOIN ad_accounts ad ON ad.id = c.ad_account_id
            INNER JOIN users u ON u.id = c.user_id
          WHERE  fb.date >  '${startDate}' AND  fb.date <= '${endDate}'
          ${mediaBuyerCondition}
          GROUP BY fb.date, u.name, ad.name
      ),
      agg_tiktok AS (
          SELECT
            COALESCE(TRIM(LOWER(u.name)), 'unknown') AS media_buyer,
            CAST(ROUND(SUM(tt.total_spent)::decimal, 2) AS FLOAT) as spend
          FROM tiktok tt
            INNER JOIN campaigns c ON c.id = tt.campaign_id AND c.traffic_source = 'tiktok'
            INNER JOIN users u ON u.id = c.user_id
          WHERE tt.date >  '${startDate}'
            AND tt.date <= '${endDate}'
            ${mediaBuyerCondition}
          GROUP BY u.name
      )
      SELECT
        COALESCE(agg_fb.media_buyer, tt.media_buyer) as media_buyer,
        COALESCE(SUM(agg_fb.spend), 0) AS fb_spend,
        COALESCE(
          CAST (
            ROUND(
              SUM(
                CASE
                  WHEN agg_fb.account_name LIKE '%Nitido%' THEN agg_fb.spend * 1.02
                  WHEN agg_fb.account_name LIKE '%Rebate%' THEN agg_fb.spend * 1.03
                  WHEN agg_fb.account_name LIKE '%INPULSE%' OR agg_fb.account_name LIKE '%CSUY%' THEN agg_fb.spend * inp.coefficient
                  ELSE agg_fb.spend
                END
              )::decimal, 2
            ) AS FLOAT
          ), 0
        ) as fb_spend_plus_fee,
        COALESCE(SUM(tt.spend), 0) AS tiktok_spend
      FROM agg_fb
      LEFT JOIN inpulse inp ON inp.coefficient_date = agg_fb.fb_date
      FULL OUTER JOIN agg_tiktok tt ON tt.media_buyer = agg_fb.media_buyer
      GROUP BY agg_fb.media_buyer, tt.media_buyer
      ),
      total_revenues AS (
        SELECT
            COALESCE(TRIM(LOWER(u.name)), 'unknown') AS media_buyer,
            SUM(CASE WHEN cr.traffic_source = 'facebook' THEN cr.total_revenue ELSE 0 END) as fb_revenue,
            SUM(CASE WHEN cr.traffic_source = 'tiktok' THEN cr.total_revenue ELSE 0 END) as tiktok_revenue,
            SUM(cr.total_revenue) as total_revenue
        FROM users u
            FULL OUTER JOIN campaigns c ON u.id = c.user_id
            FULL OUTER JOIN crossroads_partitioned cr ON c.id = cr.campaign_id
        WHERE cr.date >  '${startDate}'
          AND cr.date <= '${endDate}'
          ${mediaBuyerCondition}
        GROUP BY u.name
      ),
      UserIDs AS (
          SELECT
            id,
            COALESCE(TRIM(LOWER(u.name)), 'unknown') AS media_buyer
          FROM users u
          ${mediaBuyer ? 'WHERE u.id = ' + mediaBuyer : ''}
      )
    SELECT
      CONCAT('${startDate}', '/', '${endDate}') AS date,
      COALESCE(ts.media_buyer, tr.media_buyer, u.media_buyer) as media_buyer,
      COALESCE(ts.fb_spend, 0) as fb_spend,
      COALESCE(ts.fb_spend_plus_fee, 0) as fb_spend_plus_fee,
      COALESCE(tr.fb_revenue, 0) as fb_revenue,
      COALESCE(ts.tiktok_spend, 0) as tiktok_spend,
      COALESCE(tr.tiktok_revenue, 0) as tiktok_revenue,
      COALESCE(tr.total_revenue, 0) as total_revenue
    FROM UserIDs u
      FULL OUTER JOIN total_spends ts ON ts.media_buyer = u.media_buyer
      FULL OUTER JOIN total_revenues tr ON tr.media_buyer = u.media_buyer

    ORDER BY media_buyer DESC;
  `

  return db.raw(query)
};

const main = async () => {
  const { rows } = await crossroadsTotalsByMediaBuyer('2023-06-26', '2023-07-04', 1);
  console.log(rows)
}

// main()

module.exports = crossroadsTotalsByMediaBuyer;
