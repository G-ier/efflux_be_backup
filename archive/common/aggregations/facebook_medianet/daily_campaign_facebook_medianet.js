const db = require('../../../../data/dbConfig');

const dailyCampaignFacebookMediaNet = (campaign_id, startDate, endDate) => {
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
      AND
          campaign_id = '${campaign_id}'
      GROUP BY date ORDER BY date
    ), agg_fb AS (
        SELECT
          fb.date as fb_date,
          max(ad.name) as account_name,
          CAST(ROUND(SUM(CASE WHEN ad.name LIKE '%Nitido%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as nitido_spend,
          CAST(ROUND(SUM(CASE WHEN ad.name LIKE '%Rebate%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as rebate_spend,
          CAST(ROUND(SUM(CASE WHEN ad.name LIKE '%INPULSE%' OR ad.name LIKE '%CSUY%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as inpulse_spend,
          CAST(ROUND(SUM(CASE WHEN ad.name NOT LIKE '%INPULSE%' AND ad.name NOT LIKE '%CSUY%' AND ad.name NOT LIKE '%Rebate%' AND ad.name NOT LIKE '%Nitido%' THEN fb.total_spent ELSE 0 END)::decimal, 2) AS FLOAT) as own_spend,
          MAX(fb.created_at) as fb_last_updated,
          MAX(fb.updated_at) as last_updated,
          (CASE WHEN SUM(fb.lead) IS null THEN 0 ELSE CAST(SUM(fb.lead) AS INTEGER) END) as fb_lead,
          CAST(ROUND(SUM(fb.total_spent)::decimal, 2) AS FLOAT) as spend,
          CAST(SUM(fb.link_clicks) AS INTEGER) as link_clicks,
          CAST(SUM(fb.conversions) AS INTEGER) as fb_conversions,
          CAST(SUM(fb.impressions) AS INTEGER) as impressions
        FROM facebook_partitioned fb
          INNER JOIN campaigns c ON c.id = fb.campaign_id AND c.traffic_source = 'facebook'
          INNER JOIN ad_accounts ad ON ad.id = c.ad_account_id
        WHERE  fb.date >  '${startDate}'
          AND  fb.date <= '${endDate}'
          AND fb.campaign_id = '${campaign_id}'
        GROUP BY fb.date
    )
    SELECT
        inp.coefficient_date as date,
        CAST(ROUND((agg_fb.spend)::decimal, 2) AS FLOAT) as spend,
        CAST(ROUND((agg_fb.nitido_spend * 1.02 + agg_fb.rebate_spend * 1.03 + inpulse_spend * inp.coefficient + own_spend)::decimal, 2) AS FLOAT) AS spend_plus_fee,
        CAST((agg_fb.fb_conversions) AS INTEGER) as fb_conversions,
        CAST((agg_mn.pbImpressions) AS INTEGER) as pbImpressions,
        CAST((agg_fb.impressions) AS INTEGER) as impressions,
        CAST((agg_fb.link_clicks) AS INTEGER) as link_clicks,
        CAST((agg_mn.total_clicks) AS INTEGER) as total_clicks,
        CAST((agg_mn.revenue) AS INTEGER) as revenue
    FROM agg_mn
        FULL OUTER JOIN agg_fb ON agg_fb.fb_date = agg_mn.mn_date
        FULL OUTER JOIN inpulse inp ON inp.coefficient_date = agg_fb.fb_date;
  `;
  return db.raw(query);
}

module.exports = dailyCampaignFacebookMediaNet;
