const db = require('../../../data/dbConfig');
const {threeDaysAgoYMD} = require("../../day");
const selects = require("../selects");

const dailyCampaignFacebookCrossroads = (campaign_id, startDate, endDate) => {

  `
  Summary:
    Gets the data from crossroads, facebook and postback_events tables for a specific campaign
    queries by campaign_id and date and aggregates it by date.

  Params:
    campaign_id: the campaign id
    startDate: the start date of the data
    endDate: the end date of the data
  Returns:
    the aggregated data for that timespan of the 3 tables
    for a specific campaign
    for a timespan
  `

  query = `
  WITH agg_cr AS (
    SELECT cr.request_date as date,
      ${selects.CROSSROADS_PARTITIONED}
    FROM crossroads_partitioned cr
    WHERE cr.request_date > '${startDate}'
      AND cr.request_date <= '${endDate}'
      AND cr.campaign_id = '${campaign_id}'
    GROUP BY cr.request_date
  ), agg_fb AS (
    SELECT fb.date as fb_date,
      ${selects.FACEBOOK}
    FROM facebook_partitioned fb
    WHERE
      fb.date > '${startDate}'
      AND fb.date <= '${endDate}'
      AND fb.campaign_id = '${campaign_id}'
    GROUP BY fb.date
  ), agg_fbc AS (
    SELECT
        pb.date as fbc_date,
        CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
        CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
        CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions
        --TO_CHAR(CURRENT_TIMESTAMP, 'dd/HH24:MI (TZ)') as sheet_last_update
        FROM postback_events_partitioned pb
        WHERE    pb.date >  '${startDate}'
          AND    pb.date <= '${endDate}'
          AND    pb.campaign_id = '${campaign_id}'
        GROUP BY pb.date
    )
  SELECT * FROM agg_cr
    FULL OUTER JOIN agg_fb ON agg_cr.date = agg_fb.fb_date
    FULL OUTER JOIN agg_fbc on agg_fbc.fbc_date = agg_cr.date
  ORDER BY agg_fb.date ASC
  `
  // console.log('query', query)
  return db.raw(query);

}

module.exports = dailyCampaignFacebookCrossroads;
