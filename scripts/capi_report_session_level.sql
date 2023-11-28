------------------------------------------------------------------------------------------------------------------------------------------------------------
  -- CAPI Report Logs Versus API Final Data Session Level
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
			isos_timestamp > '2023-11-28' AND isos_timestamp < '2023-11-29' AND traffic_source = 'tiktok'
		ORDER BY 
			reported_date, reported_hour
	) 
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
	ORDER BY 
		cl.isos_timestamp;
