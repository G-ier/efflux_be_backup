const db = require('../../data/dbConfig');
const { dayYMD, yesterdayYMD } = require('../day');
const selects = require("./selects");

function hourlyMediaBuyerGoogleAMG(start_date, end_date, mediaBuyer, campaignId, adAccountId, q) {
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
    WITH agg_amg AS (
      SELECT DISTINCT ON(amg.hour) amg.hour,
          ${selects.AMG}
      FROM amg
        INNER JOIN campaigns c ON amg.campaign_id = c.id
            AND c.traffic_source = 'google'
            AND c.network = 'amg'
            ${mediaBuyerCondition}
            ${adAccountIdCondition}
            ${queryCondition}
      WHERE  amg.date >  '${startDate}'
        AND  amg.date <= '${endDate}'
        ${campaignIDCondition}
      GROUP BY  amg.hour
    ), agg_google AS (
      SELECT DISTINCT ON( google.hour ) google.hour,
        ${selects.GOOGLE}
      FROM google_ads google
        INNER JOIN campaigns c ON google.campaign_id = c.id
            AND c.traffic_source = 'google'
            AND c.network = 'amg'
            ${mediaBuyerCondition}
            ${adAccountIdCondition}
            ${queryCondition}
      WHERE  google.date >  '${startDate}'
        AND  google.date <= '${endDate}'
        ${campaignIDCondition}
      GROUP BY google.hour
    )
      SELECT agg_amg.hour, agg_google.hour as hour2,
        CAST(ROUND(SUM(agg_amg.revenue)::decimal, 2) AS FLOAT) as revenue,
        CAST(SUM(amg.clicks) AS INTEGER) as revenue_clicks,
        CAST(SUM(amg.spam_clicks) AS INTEGER) as spam_clicks,
        CAST(SUM(amg.queries) AS INTEGER) as queries,
        CAST(SUM(amg.matched_queries) AS INTEGER) as matched_queries,
        CAST(SUM(amg.spam_queries) AS INTEGER) as spam_queries,
        CAST(SUM(amg.impressions) AS INTEGER) as impressions,
        CAST(SUM(amg.spam_impressions) AS INTEGER) as spam_impressions,
        SUM(agg_google.total_spent) as total_spent,
        CAST(SUM(agg_google.link_clicks) AS INTEGER) as link_clicks
      FROM agg_amg FULL OUTER JOIN agg_google USING (hour)
      GROUP BY agg_amg.hour, agg_google.hour
  `);
}

module.exports = hourlyMediaBuyerGoogleAMG;
