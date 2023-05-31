const db = require('../../../data/dbConfig');
const selects = require("../selects");

function campaignsFacebookMedianet(startDate, endDate, mediaBuyer, adAccount, q) {

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
        WITH restriction AS (
          SELECT DISTINCT campaign_id
          FROM media_net_stats
          WHERE
            date > '${startDate}' AND date <= '${endDate}'
        ), agg_mn AS (
            SELECT
                campaign_id,
                SUM(impressions) AS total_impressions,
                SUM(total_clicks) AS total_clicks,
                SUM(estimated_revenue) AS total_revenue
            FROM
                media_net_stats
            ${
              (mediaBuyerCondition !== '' || adAccountCondition !== '' || queryCondition !== '')
                ? `INNER JOIN campaigns c ON cr.campaign_id = c.id`
                : ''
            }
                ${mediaBuyerCondition}
                ${adAccountCondition}
                ${queryCondition}
            WHERE
                date > '${startDate}' AND date <= '${endDate}'
            GROUP BY
                campaign_id
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
              AND fb.campaign_id IN (SELECT campaign_id FROM restriction)
              GROUP BY fb.campaign_id
        )
        SELECT *
        FROM agg_mn
          FULL OUTER JOIN agg_fb USING(campaign_id);
    `

    return db.raw(query);
}

module.exports = campaignsFacebookMedianet;
