const db = require('../../../data/dbConfig');
const { dayYMD, yesterdayYMD } = require('../../day');
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
    ), agg_mn AS (
        SELECT
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
        GROUP BY hour
    ), agg_fb AS (
        SELECT
          fb.hour as fb_hour,
            ${selects.FACEBOOK}
          FROM facebook_partitioned fb
          ${
            (mediaBuyerCondition !== '' || adAccountIdCondition !== '' || queryCondition !== '')
              ? `INNER JOIN campaigns c ON fb.campaign_id = c.id
                  AND c.traffic_source = 'facebook'`
              : ''
          }
          ${mediaBuyerCondition}
          ${adAccountIdCondition}
          ${queryCondition}
          WHERE  fb.date >  '${startDate}'
            AND  fb.date <= '${endDate}'
            AND fb.campaign_id IN (SELECT campaign_id FROM restriction)
            ${campaignIDCondition}
          GROUP BY fb.hour
    )
    SELECT
        (CASE
              WHEN agg_fb.fb_hour IS NOT null THEN agg_fb.fb_hour
              WHEN agg_mn.hour IS NOT null THEN agg_mn.hour
        END) as hour,
        SUM(agg_mn.pbImpressions) as pbImpressions,
        SUM(agg_mn.total_clicks) as total_clicks,
        SUM(agg_mn.revenue) as revenue,
        CAST(ROUND(SUM(agg_fb.spend)::decimal, 2) AS FLOAT) as spend,
        CAST(SUM(agg_fb.fb_conversions) AS INTEGER) as fb_conversions,
        CAST(SUM(agg_fb.link_clicks) AS INTEGER) as link_clicks,
        CAST(SUM(agg_fb.impressions) AS INTEGER) as impressions
    FROM agg_mn
        FULL OUTER JOIN agg_fb ON agg_mn.hour = agg_fb.fb_hour
    GROUP BY agg_fb.fb_hour, agg_mn.hour;
  `
  // console.log("media.net campaigns By hour", query);
  return db.raw(query);
}

// hourlyMediaNetFacebook('2023-05-01', '2023-05-30', null, null, null, null)

module.exports = hourlyMediaNetFacebook;
