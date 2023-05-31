const db = require('../../../data/dbConfig');
const { dayYMD, yesterdayYMD } = require('../../day');
const selects = require("../selects");

function hourlyMediaBuyerFacebookCrossroads(start_date, end_date, mediaBuyer, campaignId, adAccountId, q) {
  `
  Summary:
    Gets the data from crossroads, facebook and postback_events tables
    , queries by date and aggreagates it by date and hour.

    The problem i think it's worth noting for both 1/ and /3 is the date aggregations. When i aggregate by hour in facebook, hour is on the ad
    account time zone while date in utc, which is a incogruency inside facebook data. Other than this we join this grouping with crossroads
    and postback data which are in PST. And the start and end date is in the perspective of PST.

  Params:
    startDate: the start date of the data
    endDate: the end date of the data
    mediaBuyer (optional): the media buyer id
    campaignId (optional): the campaign id
    adAccountId (optional): the ad account id
    q (optional): the search query

  Returns:
    the aggregated data for that timespan of the 3 tables
  `

  const campaignIDCondition = campaignId
    ? `AND campaign_id = '${campaignId}'`
    : '';

  const mediaBuyerCondition = (mediaBuyer !== 'admin' && mediaBuyer)
    ? `AND user_id = ${mediaBuyer}`
    : '';

  const adAccountIdCondition = adAccountId
    ? `AND c.ad_account_id = ${adAccountId}`
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
  query = `

  WITH restriction AS (
    SELECT DISTINCT campaign_id
      FROM crossroads_partitioned
    WHERE
      request_date > '${startDate}' AND request_date <= '${endDate}'
    AND traffic_source = 'facebook'
  ), agg_cr AS (
    SELECT cr.hour as cr_hour,
        ${selects.CROSSROADS_PARTITIONED}
    FROM crossroads_partitioned cr
    ${
      (mediaBuyerCondition !== '' || adAccountIdCondition !== '' || queryCondition !== '')
        ? `INNER JOIN campaigns c ON cr.campaign_id = c.id`
        : ''
    }
      ${mediaBuyerCondition}
      ${adAccountIdCondition}
      ${queryCondition}
    WHERE  cr.request_date >  '${startDate}'
      AND  cr.request_date <= '${endDate}'
      AND  cr.traffic_source = 'facebook'
      ${campaignIDCondition}
    GROUP BY  cr.hour
  ), agg_fb AS (
    SELECT fb.hour as fb_hour,
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
  ), agg_fbc AS (
    SELECT pb.hour as fbc_hour,
    CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions,
    CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
    CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
    MAX(pb.updated_at) as last_updated,
    CAST(COUNT(distinct (CASE WHEN pb.event_type = 'lead' THEN fbclid END)) AS INTEGER) as pb_uniq_conversions
    FROM postback_events_partitioned pb
    ${
      (mediaBuyerCondition !== '' || adAccountIdCondition !== '' || queryCondition !== '')
        ? `INNER JOIN campaigns c ON pb.campaign_id = c.id`
        : ''
    }
      ${mediaBuyerCondition}
      ${adAccountIdCondition}
      ${queryCondition}
    WHERE  pb.date >  '${startDate}'
      AND  pb.date <= '${endDate}'
      AND pb.traffic_source = 'facebook'
      AND pb.network = 'crossroads'
      ${campaignIDCondition}
    GROUP BY pb.hour
  )
  SELECT
      (CASE
          WHEN agg_fb.fb_hour IS NOT null THEN agg_fb.fb_hour
          WHEN agg_cr.cr_hour IS NOT null THEN agg_cr.cr_hour
          WHEN agg_fbc.fbc_hour IS NOT null THEN agg_fbc.fbc_hour
      END) as hour,
     ${selects.FACEBOOK_CROSSROADS}
  FROM agg_cr
     FULL OUTER JOIN agg_fb ON agg_cr.cr_hour = agg_fb.fb_hour
     FULL OUTER JOIN agg_fbc ON agg_fbc.fbc_hour = agg_fb.fb_hour
     GROUP BY agg_cr.cr_hour, agg_fb.fb_hour, agg_fbc.fbc_hour;
  `
  // console.log("crossroads campaigns By hour",query);
  return db.raw(query);
}

module.exports = hourlyMediaBuyerFacebookCrossroads;
