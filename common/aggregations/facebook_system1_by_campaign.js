const db = require('../../data/dbConfig');
const selects = require("./selects");

const facebookSystem1ByCampaignId = (campaign_id, startDate, endDate) => db.raw(`
    WITH agg_s1 AS (
      SELECT DISTINCT ON(adset_id) adset_id,
        ${selects.SYSTEM1}
      FROM system1 s1
      WHERE    s1.date >  '${startDate}'
        AND    s1.date <= '${endDate}'
        AND    s1.campaign_id = '${campaign_id}'
      GROUP BY s1.adset_id
    ), agg_fb AS (
        SELECT DISTINCT ON(fb.adset_id) fb.adset_id,
            MAX(fb.campaign_name) as campaign_name,
            ${selects.FACEBOOK}
        FROM facebook fb
        WHERE    fb.date >  '${startDate}'
          AND    fb.date <= '${endDate}'
          AND    fb.campaign_id = '${campaign_id}'
        GROUP BY fb.adset_id
    ), agg_pb_s1 AS (
          SELECT DISTINCT ON(pb_s1.adset_id) pb_s1.adset_id,
             ${selects.PB_SYSTEM1}
          FROM s1_conversions as pb_s1
          WHERE    pb_s1.date >  '${startDate}'
            AND    pb_s1.date <= '${endDate}'
            AND    pb_s1.campaign_id = '${campaign_id}'
          GROUP BY pb_s1.adset_id
      ), agg_adsets AS (
      SELECT MAX(adsets.provider_id) as adset_id,
             MAX(adsets.name) as adset_name,
             MAX(adsets.campaign_id) as campaign_id
      FROM adsets
      WHERE adsets.campaign_id = '${campaign_id}'
      GROUP BY adsets.provider_id
    )
    SELECT * FROM agg_s1
        FULL OUTER JOIN agg_fb USING (adset_id)
        FULL OUTER JOIN agg_pb_s1 USING (adset_id)
        FULL OUTER JOIN agg_adsets USING (adset_id)
`);

module.exports = facebookSystem1ByCampaignId;
