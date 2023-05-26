const db = require('../../../data/dbConfig');
const selects = require("../selects");

const facebookCrossroadsByCampaignId = (campaign_id, startDate, endDate) => {
  `
  Summary:
    Gets the data from crossroads, facebook and postback_events tables for a specific campaign
    queries by campaign_id and date and aggregates it by adset_id.

  Params:
    campaign_id: the campaign id
    startDate: the start date of the data
    endDate: the end date of the data
  Returns:
    the aggregated data for that timespan of the 3 tables
    for a specific campaign
  `

  query = `
  WITH agg_cr AS (
    SELECT adset_id,
      ${selects.CROSSROADS_PARTITIONED}
    FROM crossroads_partitioned cr
    WHERE    cr.request_date >  '${startDate}'
      AND    cr.request_date <= '${endDate}'
      AND    cr.campaign_id = '${campaign_id}'
    GROUP BY cr.adset_id
  ), agg_fb AS (
      SELECT fb.adset_id,
          MAX(fb.campaign_name) as campaign_name,
          ${selects.FACEBOOK}
      FROM facebook_partitioned fb
      WHERE    fb.date >  '${startDate}'
        AND    fb.date <= '${endDate}'
        AND    fb.campaign_id = '${campaign_id}'
      GROUP BY fb.adset_id
  ), agg_fbc AS (
        SELECT pb.adset_id,
          CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as pb_lander_conversions,
          CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as pb_serp_conversions,
          CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as pb_conversions
        FROM postback_events_partitioned pb
        WHERE    pb.date >  '${startDate}'
          AND    pb.date <= '${endDate}'
          AND    pb.campaign_id = '${campaign_id}'
        GROUP BY pb.adset_id
    ), agg_adsets AS (
        SELECT MAX(adsets.provider_id) as adset_id,
               MAX(adsets.name) as adset_name,
               MAX(adsets.campaign_id) as campaign_id
        FROM adsets
        WHERE adsets.campaign_id = '${campaign_id}'
        GROUP BY adsets.provider_id
    )
  SELECT * FROM agg_cr
      FULL OUTER JOIN agg_fb USING (adset_id)
      FULL OUTER JOIN agg_adsets USING (adset_id)
      FULL OUTER JOIN agg_fbc USING (adset_id)
  `
  // console.log("Campaign Query", query);
  return db.raw(query);

};

module.exports = facebookCrossroadsByCampaignId;
