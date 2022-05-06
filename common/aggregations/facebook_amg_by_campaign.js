const db = require('../../data/dbConfig');
const selects = require("./selects");

const facebookAMGByCampaignId = (campaign_id, startDate, endDate) => db.raw(`
    WITH agg_amg AS (
      SELECT DISTINCT ON(campaign_id) campaign_id,
        ${selects.AMG}
      FROM amg
      WHERE  amg.date >  '${startDate}'
        AND  amg.date <= '${endDate}'
        AND  amg.campaign_id = '${campaign_id}'
      GROUP BY amg.campaign_id
    ), agg_fb AS (
        SELECT DISTINCT ON(fb.campaign_id) fb.campaign_id,
            MAX(fb.campaign_name) as campaign_name,
            ${selects.FACEBOOK}
        FROM facebook fb
        WHERE    fb.date >  '${startDate}'
          AND    fb.date <= '${endDate}'
          AND    fb.campaign_id = '${campaign_id}'
        GROUP BY fb.campaign_id
    )
    SELECT * FROM agg_amg FULL OUTER JOIN agg_fb USING (campaign_id)
`);

module.exports = facebookAMGByCampaignId;
