const calendar              = require('../../../common/day');
const db                    = require('../../../data/dbConfig');


function mediaBuyersActivityCrossroads({start_date, end_date, media_buyer}) {


  const startDate = calendar.yesterdayYMD(start_date);
  const endDate = end_date;
  const mediaBuyer = media_buyer !== 'undefined' ? media_buyer : null;

  console.log("Start Date", startDate)
  console.log("End Date", endDate)
  console.log("Media Buyer", mediaBuyer)
  const mediaBuyerCondition = mediaBuyer
    ? `WHERE id = ${mediaBuyer}`
    : '';

  let query = `
    WITH tiktok_spent AS (
      WITH DateSeries AS (
        SELECT spend_date
          FROM (
              SELECT to_char(generate_series(
                  '${startDate}'::date, -- This is the start date
                  '${endDate}'::date, -- This is the end date
                  '1 day'::interval
              ), 'YYYY-MM-DD') AS spend_date
          ) AS date_series
        WHERE spend_date > '${startDate}' AND spend_date <= '${endDate}'
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
          tiktok tt ON c.id = tt.campaign_id AND tt.date = d.spend_date
      GROUP BY
          u.id,
          u.name,
          d.spend_date
    ),
    facebook_spent AS (
      WITH DateSeries AS (
        SELECT spend_date
          FROM (
              SELECT to_char(generate_series(
                  '${startDate}'::date, -- This is the start date
                  '${endDate}'::date, -- This is the end date
                  '1 day'::interval
              ), 'YYYY-MM-DD') AS spend_date
          ) AS date_series
        WHERE spend_date > '${startDate}' AND spend_date <= '${endDate}'
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
            facebook_partitioned fb ON c.id = fb.campaign_id AND fb.date = d.spend_date
        GROUP BY
            u.id,
            d.spend_date
    ),
    CampaignsDataTikTok AS (
        SELECT
            c.user_id,
            to_char(DATE(c.created_time), 'YYYY-MM-DD') AS tiktok_campaign_date,
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
            to_char(DATE(a.created_time), 'YYYY-MM-DD') AS tiktok_adset_date,
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
            to_char(DATE(c.created_time), 'YYYY-MM-DD') AS facebook_campaign_date,
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
            to_char(DATE(a.created_time), 'YYYY-MM-DD') AS facebook_adset_date,
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
        ts.id as media_buyer_id,
        ts.name as media_buyer,
        TO_CHAR(ts.spend_date::timestamp, 'YYYY-MM-DD') as date,
        CAST(COALESCE(cdt.new_campaigns_tiktok, 0) AS FLOAT) as new_campaigns_tiktok,
        CAST(COALESCE(adt.new_adsets_tiktok, 0) AS FLOAT) as new_adsets_tiktok,
        ts.total_tiktok_spend,
        CAST(COALESCE(cdf.new_facebook_campaigns, 0) AS FLOAT) as new_facebook_campaigns,
        CAST(COALESCE(adf.new_adsets_facebook, 0) AS FLOAT) as new_adsets_facebook,
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

const main = async () => {
  const { rows } = await mediaBuyersActivityCrossroads({start_date : '2023-07-04', end_date: '2023-07-04'})
  console.log(rows[0])
  const res = rows.reduce((acc, row) => {
    console.log(row.date)
    acc += row.total_facebook_spend
    return acc
  }, 0)
  console.log(res)

}

// main()

module.exports = mediaBuyersActivityCrossroads;
