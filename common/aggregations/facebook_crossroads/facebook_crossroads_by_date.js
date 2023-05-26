const db = require("../../../data/dbConfig");
const selects = require('../selects');

const facebookCrossroadsByDate = (startDate, endDate) => {

  `
  Summary:
    Gets the data from crossroads, facebook and postback_events tables
    queries by date and aggregates by date.

    If I'm quering the joint of traffic source, network and postbacks I have to put not condition on
    the traffic source, condition the networks on the traffic source and condition the postbacks on the network
    and traffic source.

  Params:
    startDate: the start date of the data
    endDate: the end date of the data
  Returns:
    the aggregated data for that timespan of the 3 tables
  `

  query = `
  WITH agg_cr AS (
    SELECT cr.request_date as date,
    MAX(cr.created_at) as cr_last_updated,
    ${selects.CROSSROADS_PARTITIONED}
    FROM crossroads_partitioned cr
      WHERE  cr.request_date >  '${startDate}'
      AND   cr.request_date <= '${endDate}'
      AND cr.traffic_source = 'facebook'
    GROUP BY  cr.request_date
  ), agg_fb AS (
      SELECT fb.date as fb_date,
      MAX(fb.created_at) as fb_last_updated,
      ${selects.FACEBOOK}
      FROM facebook_partitioned fb
      WHERE  fb.date >  '${startDate}'
      AND  fb.date <= '${endDate}'
      GROUP BY fb.date
  ), agg_fbc AS (
        SELECT
          pb.date as fbc_date,
          CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
          CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
          CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions
          --TO_CHAR(CURRENT_TIMESTAMP, 'dd/HH24:MI (TZ)') as sheet_last_update
        FROM postback_events_partitioned pb
        WHERE pb.date > '${startDate}' AND pb.date <= '${endDate}'
        AND pb.traffic_source = 'facebook'
        AND pb.network = 'crossroads'
      GROUP BY pb.date
  )
  SELECT
    (CASE
        WHEN agg_fb.fb_date IS NOT null THEN agg_fb.fb_date
        WHEN agg_cr.date IS NOT null THEN agg_cr.date
        WHEN agg_fbc.fbc_date IS NOT null THEN agg_fbc.fbc_date
        ELSE null
    END) as date,
    MAX(fb_last_updated) as fb_last_updated,
    MAX(cr_last_updated) as cr_last_updated,
    ${selects.FACEBOOK_CROSSROADS}
  FROM agg_cr
    FULL OUTER JOIN agg_fb ON agg_cr.date = agg_fb.fb_date
    FULL OUTER JOIN agg_fbc on agg_fbc.fbc_date = agg_cr.date
  GROUP BY agg_fb.fb_date, agg_fbc.fbc_date, agg_cr.date
  ORDER BY agg_cr.date ASC
  `;
  // console.log("facebookCrossroadsByDate", query);
  return db.raw(query);
};

module.exports = facebookCrossroadsByDate;
