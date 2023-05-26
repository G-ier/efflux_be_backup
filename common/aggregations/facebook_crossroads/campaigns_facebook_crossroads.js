const db = require('../../../data/dbConfig');
const selects = require("../selects");

function campaignsFacebookCrossroads(startDate, endDate, mediaBuyer, adAccount, q) {

  `
  Summary:
    Gets the data from crossroads, facebook and postback_events tables
    queries by date, optionally by media buyer and ad account and aggregates it by campaign_id.

  Params:
    startDate: the start date of the data
    endDate: the end date of the data
    mediaBuyer (optional): the media buyer id
    adAccount (optional): the ad account id
    q (optional): the search query

  Returns:
    the aggregated data for that timespan of the 3 tables
  `

  const mediaBuyerCondition = (mediaBuyer !== 'admin' && mediaBuyer)
    ? `AND user_id = ${mediaBuyer}`
    : '';

  const adAccountCondition = adAccount
    ? `AND c.ad_account_id = ${adAccount}`
    : '';

  const queryCondition = q
    ? `AND c.name ILIKE '%${q}%'`
    : '';

  let query = `
  WITH agg_cr AS (
    SELECT cr.campaign_id,
        ${selects.CROSSROADS_PARTITIONED}
    FROM crossroads_partitioned cr
    ${
      (mediaBuyerCondition !== '' || adAccountCondition !== '' || queryCondition !== '')
        ? `INNER JOIN campaigns c ON cr.campaign_id = c.id`
        : ''
    }
        ${mediaBuyerCondition}
        ${adAccountCondition}
        ${queryCondition}
    WHERE cr.request_date >  '${startDate}'
      AND cr.request_date <= '${endDate}'
      AND cr.traffic_source = 'facebook'
    GROUP BY cr.campaign_id
  ), agg_fb AS (
      SELECT fb.campaign_id,
        MAX(c.name) as campaign_name,
        ${selects.FACEBOOK}
      FROM facebook_partitioned fb
      INNER JOIN campaigns c ON fb.campaign_id = c.id
        AND c.traffic_source = 'facebook'
          ${mediaBuyerCondition}
          ${adAccountCondition}
          ${queryCondition}
      WHERE  fb.date >  '${startDate}'
        AND  fb.date <= '${endDate}'
      GROUP BY fb.campaign_id
  ), agg_fbc AS (
      SELECT pb.campaign_id,
      CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions,
      CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
      CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
        MAX(pb.updated_at) as last_updated,
        CAST(COUNT(distinct (CASE WHEN pb.event_type = 'lead' THEN fbclid END)) AS INTEGER) as pb_uniq_conversions
      FROM postback_events_partitioned as pb
      ${
        (mediaBuyerCondition !== '' || adAccountCondition !== '' || queryCondition !== '')
          ? `INNER JOIN campaigns c ON pb.campaign_id = c.id`
          : ''
      }
          ${mediaBuyerCondition}
          ${adAccountCondition}
          ${queryCondition}
      WHERE pb.date > '${startDate}' AND pb.date <= '${endDate}'
      AND pb.traffic_source = 'facebook'
      GROUP BY pb.campaign_id
  )
  SELECT *
    FROM agg_fb
    FULL OUTER JOIN agg_cr USING(campaign_id)
    FULL OUTER JOIN agg_fbc USING(campaign_id)
  ORDER BY agg_fb.campaign_name ASC
  `;
  // console.log("Campaigns Facebook Crossroads Query", query)
  return db.raw(query);

}

module.exports = campaignsFacebookCrossroads;
