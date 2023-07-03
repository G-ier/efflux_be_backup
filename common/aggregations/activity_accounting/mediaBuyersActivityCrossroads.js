const calendar              = require('../../../common/day');
const db                    = require('../../../data/dbConfig');


function mediaBuyersActivityCrossroads({start_date, end_date, mediaBuyer}) {
  const startDate = start_date
  const endDate = calendar.tomorrowYMD(end_date, timeZone = "UTC")

  const mediaBuyerCondition = mediaBuyer
    ? `WHERE id = ${mediaBuyer}`
    : '';

  let query = `
    WITH tiktok_spent AS (
      WITH DateSeries AS (
          SELECT generate_series(
              '${startDate}'::date, -- This is the start date
              '${end_date}'::date, -- This is the end date
              '1 day'::interval
          ) AS spend_date
      ), UserIDs AS (
          SELECT id, name
          FROM users
          ${mediaBuyerCondition} -- This is the media_buyer_id
      )
      SELECT
          u.id,
          u.name,
          d.spend_date,
          COALESCE(SUM(tt.total_spent), 0) AS total_tiktok_spend
      FROM
          UserIDs u
      CROSS JOIN
          DateSeries d
      LEFT JOIN
          campaigns c ON u.id = c.user_id AND c.traffic_source = 'tiktok'
      LEFT JOIN
          tiktok tt ON c.id = tt.campaign_id AND tt.date::date = d.spend_date
      GROUP BY
          u.id,
          u.name,
          d.spend_date
    ),
    facebook_spent AS (
        WITH DateSeries AS (
            SELECT generate_series(
                '${startDate}'::date,
                '${end_date}'::date,
                '1 day'::interval
            ) AS spend_date
        ), UserIDs AS (
            SELECT id
            FROM users
            ${mediaBuyerCondition} -- This is the media_buyer_id
        )
        SELECT
            u.id,
            d.spend_date,
            COALESCE(SUM(fb.total_spent), 0) AS total_facebook_spend
        FROM
            UserIDs u
        CROSS JOIN
            DateSeries d
        LEFT JOIN
            campaigns c ON u.id = c.user_id AND c.traffic_source = 'facebook'
        LEFT JOIN
            facebook_partitioned fb ON c.id = fb.campaign_id AND fb.date::date = d.spend_date
        GROUP BY
            u.id,
            d.spend_date
    ),
    CampaignsDataTikTok AS (
        SELECT
            c.user_id,
            DATE(c.created_time) AS tiktok_campaign_date,
            COUNT(DISTINCT c.id) AS new_campaigns_tiktok
        FROM
            campaigns c
        LEFT JOIN
            tiktok tt ON c.id = tt.campaign_id
        WHERE
            c.created_time > '${startDate}' AND c.created_time <= '2023-06-31' AND c.traffic_source = 'tiktok'
        GROUP BY
            c.user_id, tiktok_campaign_date
    ),
    AdsetsDataTikTok AS (
        SELECT
            a.user_id,
            DATE(a.created_time) AS tiktok_adset_date,
            COUNT(DISTINCT a.id) AS new_adsets_tiktok
        FROM
            adsets a
        LEFT JOIN
            tiktok tt ON a.provider_id = tt.adset_id
        WHERE
            a.created_time > '${startDate}' AND a.created_time <= '${endDate}'  AND a.traffic_source = 'tiktok'
        GROUP BY
            a.user_id, tiktok_adset_date
    ),
    CampaignsDataFacebook AS (
        SELECT
            c.user_id,
            DATE(c.created_time) AS facebook_campaign_date,
            COUNT(DISTINCT c.id) AS new_facebook_campaigns

        FROM
            campaigns c
        LEFT JOIN
            facebook_partitioned fb ON c.id = fb.campaign_id
        WHERE
            c.created_time > '${startDate}' AND c.created_time <= '${endDate}'  AND c.traffic_source = 'facebook'
        GROUP BY
            c.user_id, facebook_campaign_date
    ),
    AdsetsDataFacebook AS (
        SELECT
            a.user_id,
            DATE(a.created_time) AS facebook_adset_date,
            COUNT(DISTINCT a.id) AS new_adsets_facebook
        FROM
            adsets a
        LEFT JOIN
            facebook fb ON a.provider_id = fb.adset_id
        WHERE
            a.created_time > '${startDate}' AND a.created_time <= '${endDate}' AND a.traffic_source = 'facebook'
        GROUP BY
            a.user_id, facebook_adset_date
    )
    SELECT
        ts.id,
        ts.name,
        ts.spend_date,
        COALESCE(cdt.new_campaigns_tiktok, 0) as new_campaigns_tiktok,
        COALESCE(adt.new_adsets_tiktok, 0) as new_adsets_tiktok,
        ts.total_tiktok_spend,
        COALESCE(cdf.new_facebook_campaigns, 0) as new_facebook_campaigns,
        COALESCE(adf.new_adsets_facebook, 0) as new_adsets_facebook,
        COALESCE(fs.total_facebook_spend, 0) as total_facebook_spend
    FROM
        tiktok_spent ts
    LEFT JOIN
        CampaignsDataTikTok cdt ON ts.id = cdt.user_id AND ts.spend_date = cdt.tiktok_campaign_date
    LEFT JOIN
        CampaignsDataFacebook cdf ON ts.id = cdf.user_id AND ts.spend_date = cdf.facebook_campaign_date
    LEFT JOIN
        AdsetsDataFacebook adf ON ts.id = adf.user_id AND ts.spend_date = adf.facebook_adset_date
    LEFT JOIN
        AdsetsDataTikTok adt On ts.id = adt.user_id AND ts.spend_date = adt.tiktok_adset_date
    LEFT JOIN
        facebook_spent fs ON ts.id = fs.id AND ts.spend_date = fs.spend_date
    ORDER BY
        ts.id,
        ts.spend_date;
  `
  return db.raw(query)
}


module.exports = mediaBuyersActivityCrossroads;
