const db = require('../../../data/dbConfig');
const selects = require("../selects");

const facebookCrossroadsByCampaignId = (campaign_id, startDate, endDate) => db.raw(`
    WITH agg_cr AS (
      SELECT adset_id,
        ${selects.CROSSROADS}
      FROM crossroads_stats cr
      WHERE    cr.request_date >  '${startDate}'
        AND    cr.request_date <= '${endDate}'
        AND    cr.campaign_id = '${campaign_id}'
      GROUP BY cr.adset_id
    ), agg_fb AS (
        SELECT fb.adset_id,
            MAX(fb.campaign_name) as campaign_name,
            ${selects.FACEBOOK}
        FROM facebook fb
        WHERE    fb.date >  '${startDate}'
          AND    fb.date <= '${endDate}'
          AND    fb.campaign_id = '${campaign_id}'
        GROUP BY fb.adset_id
    ), agg_fbc AS (
          SELECT fbc.adset_id,
            ${selects.FACEBOOK_CONVERSIONS}
          FROM fb_conversions as fbc
          WHERE    fbc.date >  '${startDate}'
            AND    fbc.date <= '${endDate}'
            AND    fbc.campaign_id = '${campaign_id}'
          GROUP BY fbc.adset_id
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
        FULL OUTER JOIN agg_fbc USING (adset_id)
        FULL OUTER JOIN agg_adsets USING (adset_id)
`);

module.exports = facebookCrossroadsByCampaignId;
