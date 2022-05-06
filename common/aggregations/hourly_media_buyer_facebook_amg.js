const db = require('../../data/dbConfig');
const { dayYMD, yesterdayYMD } = require('../day');
const selects = require("./selects");

function hourlyMediaBuyerFacebookAMG(start_date, end_date, mediaBuyer, campaignId, adAccountId, q) {
  // TODO Find the way to enable mediaBuyer filter. Prefix is not an option (amg) Probably we need to attach mediaBuyerId to data entry

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

  /**
   * DISTINCT ON (hour) lets us ensure there are no duplicates (it is optional btw)
   * BUT Don't group by anything except hour, if you don't want to lose data
   */
  return db.raw(`
      WITH agg_amg AS (
        SELECT DISTINCT ON(amg.hour) amg.hour,
          ${selects.AMG}
        FROM amg
          INNER JOIN campaigns c ON amg.campaign_id = c.id
              AND c.traffic_source = 'facebook'
              AND c.network = 'amg'
              ${mediaBuyerCondition}
              ${adAccountIdCondition}
        WHERE  amg.date >  '${startDate}'
          AND  amg.date <= '${endDate}'
          ${campaignIDCondition}
          ${queryCondition}
        GROUP BY  amg.hour
      ), agg_fb AS (
        SELECT DISTINCT ON( fb.hour ) fb.hour,
          ${selects.FACEBOOK}
        FROM facebook fb
          INNER JOIN campaigns c ON fb.campaign_id = c.id
            AND c.traffic_source = 'facebook'
            AND c.network = 'amg'
            ${mediaBuyerCondition}
            ${adAccountIdCondition}
            ${queryCondition}
        WHERE  fb.date >  '${startDate}'
          AND  fb.date <= '${endDate}'
          ${campaignIDCondition}
        GROUP BY fb.hour
      )
        SELECT agg_amg.hour, agg_fb.hour as hour2,
          CAST(ROUND(SUM(agg_amg.revenue)::decimal, 2) AS FLOAT) as revenue,
          CAST(SUM(agg_amg.revenue_clicks) AS INTEGER) as revenue_clicks,
          CAST(SUM(agg_amg.spam_clicks) AS INTEGER) as spam_clicks,
          CAST(SUM(agg_amg.queries) AS INTEGER) as queries,
          CAST(SUM(agg_amg.matched_queries) AS INTEGER) as matched_queries,
          CAST(SUM(agg_amg.spam_queries) AS INTEGER) as spam_queries,
          CAST(SUM(agg_amg.impressions) AS INTEGER) as impressions,
          CAST(SUM(agg_amg.spam_impressions) AS INTEGER) as spam_impressions,
          SUM(agg_fb.total_spent) as total_spent,
          CAST(SUM(agg_fb.link_clicks) AS INTEGER) as link_clicks,
          CAST(SUM(agg_fb.ts_conversions) AS INTEGER) as ts_conversions,
          CAST(SUM(agg_fb.impressions) AS INTEGER) as impressions
        FROM agg_amg FULL OUTER JOIN agg_fb USING (hour)
        GROUP BY agg_amg.hour, agg_fb.hour
  `);
}

module.exports = hourlyMediaBuyerFacebookAMG;
