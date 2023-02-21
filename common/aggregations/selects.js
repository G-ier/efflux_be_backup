const {tomorrowYMD} = require('./../day')

module.exports = {
  PB_SYSTEM1:
            `CAST(COUNT(CASE WHEN event_name = 'lead' THEN 1 ELSE null END) AS INTEGER) as pb_conversions,
             CAST(COUNT(CASE WHEN event_name = 'serp' THEN 1 ELSE null END) AS INTEGER) as pb_searches,
             CAST(COUNT(CASE WHEN event_name = 'viewcontent' THEN 1 ELSE null END) AS INTEGER) as pb_impressions,
             CAST(COUNT(distinct (CASE WHEN event_name = 'lead' THEN fbclid END)) AS INTEGER) as pb_uniq_conversions`,

  FACEBOOK: `MAX(fb.date) as date,
            MAX(fb.updated_at) as last_updated,
            (CASE WHEN SUM(fb.lead) IS null THEN 0 ELSE CAST(SUM(fb.lead) AS INTEGER) END) as fb_lead,
            CAST(ROUND(SUM(fb.total_spent)::decimal, 2) AS FLOAT) as spend,
            CAST(SUM(fb.link_clicks) AS INTEGER) as link_clicks,
            CAST(SUM(fb.conversions) AS INTEGER) as fb_conversions,
            CAST(SUM(fb.impressions) AS INTEGER) as impressions`,

  GOOGLE:   `ROUND(SUM(google.total_spent)::decimal, 3) as spend,
             CAST(SUM(google.link_clicks) AS INTEGER) as link_clicks`,

  CROSSROADS: `CAST(ROUND(SUM(cr.revenue)::decimal, 2) AS FLOAT) as revenue,
               CAST(SUM(cr.lander_searches) AS INTEGER) as searches,
               CAST(SUM(cr.lander_visitors) AS INTEGER) as lander_visits,
               CAST(SUM(cr.revenue_clicks) AS INTEGER) as conversions,
               MAX(cr.updated_at) as last_updated,
               CAST(COUNT(distinct(CASE WHEN cr.revenue_clicks > 0 THEN fbclid END)) AS INTEGER) as uniq_conversions,
               CAST(SUM(cr.total_visitors) AS INTEGER) as visitors,
               CAST(SUM(cr.tracked_visitors) AS INTEGER) as tracked_visitors`,

  SYSTEM1: `CAST(SUM(s1.revenue)::decimal AS FLOAT) as revenue,
            CAST(SUM(s1.searches) AS INTEGER) as searches,
            CAST(SUM(s1.clicks) AS INTEGER) as conversions,
            CAST(SUM(s1.total_visitors) AS INTEGER) as visitors`,

  AMG: `ROUND(SUM(amg.revenue)::decimal, 3) as revenue,
        CAST(SUM(amg.clicks) AS INTEGER) as conversions,
        CAST(SUM(amg.spam_clicks) AS INTEGER) as spam_clicks,
        CAST(SUM(amg.queries) AS INTEGER) as queries,
        CAST(SUM(amg.matched_queries) AS INTEGER) as matched_queries,
        CAST(SUM(amg.spam_queries) AS INTEGER) as spam_queries,
        CAST(SUM(amg.impressions) AS INTEGER) as impressions,
        CAST(SUM(amg.spam_impressions) AS INTEGER) as spam_impressions`,

  FACEBOOK_CONVERSIONS: `CAST(COUNT(fbc.event_id) AS INTEGER) as pb_conversions,
                        MAX(fbc.updated_at) as last_updated,
                        CAST(COUNT(distinct (CASE WHEN fbc.event_name = 'lead' THEN fbclid END)) AS INTEGER) as pb_uniq_conversions
                        `,

  FACEBOOK_CROSSROADS: `CAST(ROUND(SUM(agg_cr.revenue)::decimal, 2) AS FLOAT) as revenue,
                        CAST(ROUND(SUM(agg_cr.conversions)::decimal, 2) AS FLOAT) as conversions,
                        CAST(SUM(agg_cr.uniq_conversions) AS INTEGER) as uniq_conversions,
                        CAST(SUM(agg_cr.searches) AS INTEGER) as searches,
                        CAST(SUM(agg_cr.lander_visits) AS INTEGER) as lander_visits,
                        CAST(SUM(agg_cr.visitors) AS INTEGER) as visitors,
                        CAST(SUM(agg_cr.tracked_visitors) AS INTEGER) as tracked_visitors,
                        CAST(ROUND(SUM(agg_fb.spend)::decimal, 2) AS FLOAT) as spend,
                        CAST(SUM(agg_fb.link_clicks) AS INTEGER) as link_clicks,
                        CAST(SUM(agg_fb.ts_conversions) AS INTEGER) as ts_conversions,
                        CAST(SUM(agg_fb.impressions) AS INTEGER) as impressions,
                        CAST(SUM(agg_fbc.pb_conversions) AS INTEGER) as pb_conversions,
                        CAST(SUM(agg_fbc.pb_uniq_conversions) AS INTEGER) as pb_uniq_conversions`,

  FACEBOOK_SYSTEM1: `CAST(ROUND(SUM(agg_s1.revenue)::decimal, 2) AS FLOAT) as revenue,
                     CAST(SUM(agg_s1.searches) AS INTEGER) as searches,
                     CAST(SUM(agg_s1.conversions) AS INTEGER) as conversions,
                     CAST(SUM(agg_s1.visitors) AS INTEGER) as visitors,
                     CAST(SUM(agg_fb.spend) AS FLOAT) as spend,
                     CAST(SUM(agg_pb_s1.pb_uniq_conversions) AS INTEGER) as pb_uniq_conversions,
                     CAST(SUM(agg_pb_s1.pb_conversions) AS INTEGER) as pb_conversions,
                     CAST(SUM(agg_pb_s1.pb_searches) AS INTEGER) as pb_searches,
                     CAST(SUM(agg_pb_s1.pb_impressions) AS INTEGER) as pb_impressions,
                     CAST(SUM(agg_fb.link_clicks) AS INTEGER) as link_clicks,
                     CAST(SUM(agg_fb.ts_conversions) AS INTEGER) as ts_conversions,
                     CAST(SUM(agg_fb.impressions) AS INTEGER) as impressions`,

  PIXEL: `SUM(total_revenue) as revenue,
          SUM(total_revenue_clicks) as conversions`,

  CROSSROADS_PIXEL: `CAST(ROUND(MAX(cr_pixel.revenue)::decimal, 2) AS FLOAT) as pixel_revenue,
                     CAST(MAX(cr_pixel.conversions) AS INTEGER) as pixel_conversions,
                     CAST(ROUND(MAX(cr_pixel_last_3d.revenue)::decimal, 2) AS FLOAT) as pixel_revenue_last_3d,
                     CAST(MAX(cr_pixel_last_3d.conversions) AS INTEGER) as pixel_conversions_last_3d`,
  WHERE_BY_NETWORK: (option) => {
		switch (option.network){
			case 'system1':
				return `
					ada.tz_offset >= 0 AND fb.date > '${option.startDate}' AND fb.date <= '${option.endDate}' AND fb.hour >=ada.tz_offset OR
					ada.tz_offset >= 0 AND fb.date > '${option.endDate}' AND fb.date <= '${tomorrowYMD(option.endDate, option.timezone)}' AND fb.hour < ada.tz_offset OR
					ada.tz_offset < 0 AND fb.date > '${option.startDate}' AND fb.date <= '${option.endDate}' AND fb.hour <= 23+ada.tz_offset OR
					ada.tz_offset < 0 AND fb.date > '${option.yestStartDate}' AND fb.date <= '${option.startDate}' AND fb.hour > 23+ada.tz_offset`

			case 'unknown':
				return `
					fb.date > '${option.startDate}' AND fb.date <= '${option.endDate}'`
                  case 'crossroads':
                        return `fb.date > '${option.startDate}' AND fb.date <= '${option.endDate}'`
		}
	}
}
