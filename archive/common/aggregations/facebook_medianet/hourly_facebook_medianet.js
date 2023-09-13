const db = require('../../../../data/dbConfig');
const { dayYMD, yesterdayYMD } = require('../../../../utils/calendar');
const selects = require("../selects");

function hourlyMediaNetFacebook(start_date, end_date, mediaBuyer, campaignId, adAccountId, q) {
  const campaignIDCondition = campaignId
    ? `AND campaign_id = '${campaignId}'`
    : '';

  const mediaBuyerCondition = (mediaBuyer !== 'admin' && mediaBuyer)
    ? `AND c.user_id = ${mediaBuyer}`
    : '';

  const adAccountIdCondition = adAccountId
    ? `AND c.ad_account_id = ${adAccountId}`
    : '';

  const queryCondition = q
    ? `AND c.name iLike '%${q}%'`
    : '';

  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);

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
            hour,
            SUM(impressions) AS pbImpressions,
            SUM(total_clicks) AS total_clicks,
            SUM(estimated_revenue) AS revenue
        FROM
            media_net_stats
            ${
              (mediaBuyerCondition !== '' || adAccountIdCondition !== '' || queryCondition !== '')
                ? `INNER JOIN campaigns c ON media_net_stats.campaign_id = c.id`
                : ''
            }
            ${mediaBuyerCondition}
            ${adAccountIdCondition}
            ${queryCondition}
        WHERE
            date > '${startDate}' AND date <= '${endDate}'
            ${campaignIDCondition}
        GROUP BY hour, date
    ), agg_fb AS (
          SELECT
            fb.date as fb_date,
            fb.hour as fb_hour,
            CAST(ROUND(SUM(CASE WHEN ad.name LIKE '%Nitido%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as nitido_spend,
            CAST(ROUND(SUM(CASE WHEN ad.name LIKE '%Rebate%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as rebate_spend,
            CAST(ROUND(SUM(CASE WHEN ad.name LIKE '%INPULSE%' OR ad.name LIKE '%CSUY%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as inpulse_spend,
            CAST(ROUND(SUM(CASE WHEN ad.name NOT LIKE '%INPULSE%' AND ad.name NOT LIKE '%CSUY%' AND ad.name NOT LIKE '%Rebate%' AND ad.name NOT LIKE '%Nitido%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as own_spend,
            ${selects.FACEBOOK}
          FROM facebook_partitioned fb
          INNER JOIN campaigns c ON c.id = fb.campaign_id AND c.traffic_source = 'facebook'
            ${mediaBuyerCondition}
            ${adAccountIdCondition}
            ${queryCondition}
          INNER JOIN ad_accounts ad ON ad.id = c.ad_account_id
          WHERE  fb.date >  '${startDate}'
            AND  fb.date <= '${endDate}'
            AND fb.campaign_id IN (SELECT campaign_id FROM restriction)
            ${campaignIDCondition}
          GROUP BY fb.hour, fb_date
    )
    SELECT
        agg_fb.fb_hour as hour,
        SUM(agg_mn.pbImpressions) as pbImpressions,
        SUM(agg_mn.total_clicks) as total_clicks,
        SUM(agg_mn.revenue) as revenue,
        CAST(ROUND(SUM(agg_fb.spend)::decimal, 2) AS FLOAT) as spend,
        CAST(
          ROUND(
            SUM(
              agg_fb.nitido_spend * 1.02 +
              agg_fb.rebate_spend * 1.03 +
              inpulse_spend * inp.coefficient +
              own_spend
            )::decimal, 2
          ) AS FLOAT
        ) as spend_plus_fee,
        CAST(SUM(agg_fb.fb_conversions) AS INTEGER) as fb_conversions,
        CAST(SUM(agg_fb.link_clicks) AS INTEGER) as link_clicks,
        CAST(SUM(agg_fb.impressions) AS INTEGER) as impressions
    FROM agg_mn
        FULL OUTER JOIN agg_fb ON agg_mn.hour = agg_fb.fb_hour AND agg_mn.mn_date = agg_fb.fb_date
        INNER JOIN inpulse inp ON inp.coefficient_date = agg_fb.fb_date
    GROUP BY agg_fb.fb_hour;
  `
  return db.raw(query);
}


module.exports = hourlyMediaNetFacebook;
