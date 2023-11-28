------------------------------------------------------------------------------------------------------------------------------------------------------------

  -- CAPI Report Logs Versus API Final Data Summaries
	WITH api_finals AS (
		SELECT
			tg3 as session_id,
			date,
			hour,
			SUM(revenue_clicks) AS final_conversions,
			SUM(publisher_revenue_amount) as final_revenue
		FROM 
			raw_crossroads_data
		GROUP BY 
			tg3, date, hour
	),
	capi_logs AS (
		-- Conversions Reported For Date {date}
		SELECT 
			session_id, campaign_name, isos_timestamp, reported_date, reported_hour, conversions_reported, revenue_reported 
		FROM 
			capi_logs 
		WHERE 
			isos_timestamp > '2023-11-28' AND isos_timestamp < '2023-11-29' AND traffic_source = 'facebook'
	),
	reported_summary AS (
		SELECT 
			cl.campaign_name,
			cl.session_id,
			cl.isos_timestamp,
			cl.reported_date, 
			cl.reported_hour, 
			cl.conversions_reported, 
			af.final_conversions,
			cl.revenue_reported,
			af.final_revenue,
			af.final_conversions - cl.conversions_reported AS missed_conversions,
			af.final_revenue - cl.revenue_reported AS missed_revenue
		FROM 
			capi_logs cl
		INNER JOIN 
			api_finals af ON af.session_id =  cl.session_id
	)
	SELECT
		rs.campaign_name,
		MIN(rs.isos_timestamp) AS initial_conversion_timestmap,
		MAX(rs.isos_timestamp) AS final_conversion_timestmap,	
		SUM(rs.conversions_reported) AS total_reported_conversions,
		SUM(rs.final_conversions) AS total_conversions,
		SUM(rs.missed_conversions) AS missed_conversions,
		SUM(rs.revenue_reported) AS total_reported_revenue,
		SUM(rs.final_revenue) AS total_revenue,
		SUM(rs.missed_revenue) AS missed_revenue
	FROM 
		reported_summary rs
	GROUP BY 
		rs.campaign_name;
