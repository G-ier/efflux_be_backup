const db = require("../../data/dbConfig");

function crossroadsByDateAndCampaign(campaigns_ids = [], day) {
  const campaignsString = campaigns_ids.map((id) => `'${id}'`).join(', ');
  return db.raw(`
    SELECT cr.campaign_id as cr_campaign_id,
      MAX(cr.campaign_name) as cr_campaign_name,
      SUM(cr.total_revenue) as cr_revenue,
      CAST(SUM(cr.total_searches) AS INTEGER) as cr_searches,
      CAST(SUM(cr.total_lander_visits) AS INTEGER) as cr_lander_visits,
      CAST(SUM(cr.total_revenue_clicks) AS INTEGER) as cr_revenue_clicks,
      CAST(SUM(cr.total_visitors) AS INTEGER) as cr_visitors,
      CAST(SUM(cr.total_tracked_visitors) AS INTEGER) as cr_tracked_visitors
    FROM crossroads cr
    WHERE cr.date = '${day}'
      AND campaign_id IN (${campaignsString})
    GROUP BY cr.campaign_id
  `)
}

module.exports = crossroadsByDateAndCampaign;
