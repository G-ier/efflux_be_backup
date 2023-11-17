

--ACCURACY ANALYSIS CAMPAIGN LEVEL ALL METRICS-------------------

WITH test_campaigns AS (
	SELECT
		DISTINCT campaign_id
	FROM crossroads
	WHERE crossroads_campaign_id IN (
		SELECT 
			id
		FROM crossroads_campaigns 
		WHERE 
			name IN (
      'PT_FB_TH_PersonalLoans_190923', 'PT_FB_AU_PersonalLoans_BP_121023', 'PT_FB_US_EyeFillers_210923', 
      'PT_FB_JP_PersonalLoans_CourtneyHammond_101023', 'PC_FB_MX_PersonalLoans', 'PT_FB_GB_CarInsurance_190923',
      'PT_FB_CA_Vacation Packages_211023', 'PT_FB_ES_UsedCars_280923', 'PT_FB_US_EyeFillers1_051023',
      'PT_FB_US_DepressionTreatment_310823', 'PT_FB_MX_Contractors_211023', 'PT_FB_CA_FHALoans_211023',
      'PT_FB_MX_DataAnalyticsDegree_211023'
      )
	)
),

pb_events AS (
	SELECT 
		pb.date,
		pb.campaign_id,
		CAST(COUNT(CASE WHEN pb.event_type = 'PageView' THEN 1 ELSE null END) AS INTEGER) as lander_conversions,
		CAST(COUNT(CASE WHEN pb.event_type = 'ViewContent' THEN 1 ELSE null END) AS INTEGER) as serp_conversions,
		CAST(COUNT(CASE WHEN pb.event_type = 'Purchase' THEN 1 ELSE null END) AS INTEGER) as purchase_conversions,
		SUM(CASE WHEN pb.event_type = 'Purchase' THEN pb.pb_value ELSE 0 END) as revenue
	FROM 
		postback_events pb
	WHERE pb.date > '2023-10-27' AND pb.date <= '2023-10-28' AND pb.campaign_id IN (SELECT campaign_id FROM test_campaigns)
	GROUP BY pb.date, pb.campaign_id
), 

aggregated_conversions AS (
	SELECT
		cr.date,
		cr.campaign_id,
		SUM(cr.total_visitors) as visitors,
		SUM(cr.total_tracked_visitors) as tracked_visitors,
		SUM(cr.total_lander_visits) as lander_visits,
		SUM(cr.total_searches) as lander_searches,
		SUM(cr.total_revenue_clicks) as revenue_events,
		SUM(cr.total_revenue) as total_revenue
	FROM crossroads cr
	WHERE cr.date > '2023-10-27' AND cr.date <= '2023-10-28' AND cr.campaign_id IN (SELECT campaign_id FROM test_campaigns)
	GROUP BY cr.date, cr.campaign_id
)

SELECT 
	pb.date,
	COALESCE(pb.campaign_id, agg_c.campaign_id, 'Unkown') as campaign_id,
	
	-- Landing Accuracy
	pb.lander_conversions as pb_lander_conversions,
	agg_c.lander_visits,
	ROUND(COALESCE(CAST(pb.lander_conversions AS NUMERIC) / NULLIF(agg_c.lander_visits, 0) * 100, 0), 2) as lander_conversion_accuracy,
	
	-- SERP Accuracy
	pb.serp_conversions as pb_serp_conversions,
	agg_c.lander_searches,
	ROUND(COALESCE(CAST(pb.serp_conversions AS NUMERIC) / NULLIF(agg_c.lander_searches, 0) * 100, 0), 2) as serp_conversion_accuracy,
	
	-- Conversion Accuracy
	pb.purchase_conversions as pb_purchase_conversions,
	agg_c.revenue_events,
	ROUND(COALESCE(CAST(pb.purchase_conversions AS NUMERIC) / NULLIF(agg_c.revenue_events, 0) * 100, 0), 2) as purchase_conversion_accuracy,
	agg_c.total_revenue as revenue,
	pb.revenue as pb_revenue
	
FROM pb_events pb
INNER JOIN aggregated_conversions agg_c ON agg_c.date = pb.date AND pb.campaign_id = agg_c.campaign_id
ORDER BY pb.purchase_conversions DESC;
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

--ACCURACY ANALYSIS CAMPAIGN LEVEL ALL METRICS DEBUGGING SCRIPT-------------------
SELECT 
  pb.campaign_id,
  pb.event_type,
  COUNT(*) as count
FROM 
  postback_events pb
WHERE pb.date = '2023-10-28' AND pb.campaign_id = '23858850879740624'
GROUP BY pb.campaign_id, pb.event_type;
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------

--Finding postback by event ID-------------------
SELECT 
  pb.date,
  pb.campaign_id,
  pb.adset_id,
  pb.traffic_source,
  pb.network,
  pb.event_type
FROM 
  postback_events pb
WHERE pb.event_id = 'b2d077cbe2cc1787c112c559bf7fb2ae';
---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
