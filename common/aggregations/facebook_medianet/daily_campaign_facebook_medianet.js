const db = require('../../../data/dbConfig');

const dailyCampaignFacebookMediaNet = (campaign_id, startDate, endDate) => {
  query = `
    WITH agg_mn AS (
      SELECT
          date as mn_date,
          SUM(impressions) AS total_impressions,
          SUM(total_clicks) AS total_clicks,
          SUM(estimated_revenue) AS total_revenue
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
          MAX(fb.created_at) as fb_last_updated,
          MAX(fb.date) as date,
          MAX(fb.updated_at) as last_updated,
          (CASE WHEN SUM(fb.lead) IS null THEN 0 ELSE CAST(SUM(fb.lead) AS INTEGER) END) as fb_lead,
          CAST(ROUND(SUM(fb.total_spent)::decimal, 2) AS FLOAT) as spend,
          CAST(SUM(fb.link_clicks) AS INTEGER) as link_clicks,
          CAST(SUM(fb.conversions) AS INTEGER) as fb_conversions,
          CAST(SUM(fb.impressions) AS INTEGER) as impressions
          FROM facebook_partitioned fb
          WHERE  fb.date >  '${startDate}'
          AND  fb.date <= '${endDate}'
          AND fb.campaign_id = '${campaign_id}'
          GROUP BY fb.date
    )
    SELECT *
    FROM agg_mn
        FULL OUTER JOIN agg_fb ON agg_fb.fb_date = agg_mn.mn_date
    ORDER BY agg_mn.mn_date ASC;
  `
  return db.raw(query);
}

module.exports = dailyCampaignFacebookMediaNet;
