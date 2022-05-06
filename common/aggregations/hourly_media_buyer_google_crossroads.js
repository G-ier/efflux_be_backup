const db = require('../../data/dbConfig');
const { dayYMD, yesterdayYMD } = require('../day');
const selects = require('./selects');

function hourlyMediaBuyerGoogleCrossroads(start_date, end_date, mediaBuyer, campaignId, adAccountId, q) {
  const campaignIDCondition = campaignId
    ? `AND campaign_id = '${campaignId}'`
    : '';

  const mediaBuyerCondition = (mediaBuyer !== 'admin' && mediaBuyer)
    ? `AND user_id = ${mediaBuyer}`
    : '';

  const adAccountIdCondition = adAccountId
    ? `AND ad_account_id = ${adAccountId}`
    : '';

  const queryCondition = q
    ? `AND c.name iLike '%${q}%'`
    : '';

  const startDate = yesterdayYMD(start_date);
  const endDate = dayYMD(end_date);

  return db.raw(`
    WITH agg_cr AS (
      SELECT DISTINCT ON(cr.hour) cr.hour,
        ${selects.CROSSROADS}
      FROM crossroads cr
        INNER JOIN campaigns c ON cr.campaign_id = c.id
            AND c.traffic_source = 'google'
            AND c.network = 'crossroads'
            ${mediaBuyerCondition}
            ${adAccountIdCondition}
            ${queryCondition}
      WHERE  cr.date >  '${startDate}'
        AND  cr.date <= '${endDate}'
        ${campaignIDCondition}
      GROUP BY  cr.hour
    ), agg_google AS (
      SELECT DISTINCT ON( google.hour ) google.hour,
        ${selects.GOOGLE}
      FROM google_ads google
        INNER JOIN campaigns c ON google.campaign_id = c.id
            AND c.traffic_source = 'google'
            AND c.network = 'crossroads'
            ${mediaBuyerCondition}
            ${adAccountIdCondition}
            ${queryCondition}
      WHERE  google.date >  '${startDate}'
        AND  google.date <= '${endDate}'
        ${campaignIDCondition}
      GROUP BY google.hour
    )
      SELECT agg_cr.hour, agg_google.hour as hour2,
      CAST(ROUND(SUM(agg_cr.revenue)::decimal, 2) AS FLOAT) as revenue,
      CAST(SUM(agg_cr.searches) AS INTEGER) as searches,
      CAST(SUM(agg_cr.lander_visits) AS INTEGER) as lander_visits,
      CAST(SUM(agg_cr.revenue_clicks) AS INTEGER) as revenue_clicks,
      CAST(SUM(agg_cr.visitors) AS INTEGER) as visitors,
      CAST(SUM(agg_cr.tracked_visitors) AS INTEGER) as tracked_visitors,
      SUM(agg_google.total_spent) as total_spent,
      CAST(SUM(agg_google.link_clicks) AS INTEGER) as link_clicks
      FROM agg_cr FULL OUTER JOIN agg_google USING (hour)
      GROUP BY agg_cr.hour, agg_google.hour
  `);
}

module.exports = hourlyMediaBuyerGoogleCrossroads;
