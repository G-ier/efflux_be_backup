--------------Aggregates Comparison-----------
SELECT 
	date, 
	sum(pb_lander_conversions) as pb_lander_conversions, sum(visitors) as visitors,
	sum(pb_conversions) as pb_conversions, sum(cr_conversions) as conversions,
	sum(spend) as spend, sum(unallocated_spend) as unallocated_spend,
	sum(revenue) as revenue, sum(unallocated_revenue) as unallocated_revenue
FROM insights
	WHERE date > '2023-10-10' AND traffic_source = 'facebook' AND network = 'crossroads'
GROUP BY date
ORDER BY date;
----------------------------------------------
