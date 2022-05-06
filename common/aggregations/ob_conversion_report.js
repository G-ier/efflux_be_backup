const db = require('../../data/dbConfig');

const aggregateOBConversionReport = (startDate, endDate) => db.raw(`
  SELECT ob.campaign_id,
    MAX(c.name) as campaign_name,
    ob.section_id,
    MAX(ob.section_name) as section_name,
    MAX(ob.date) as date,
    CAST(ROUND(SUM(ob.total_spent)::decimal, 2) AS FLOAT) as total_spent,
    CAST(ROUND(
      SUM(total_spent)::decimal / CASE SUM(link_clicks)::decimal WHEN 0 THEN null ELSE SUM(link_clicks)::decimal END,
    2) AS FLOAT) as cpc,
    CAST(SUM(ob.link_clicks) AS INTEGER) as link_clicks,
    CAST(SUM(ob.conversions) AS INTEGER) as conversions,
    CAST(SUM(ob.impressions) AS INTEGER) as impressions
  FROM outbrain as ob
    INNER JOIN campaigns c ON ob.campaign_id = c.id
  WHERE ob.date > '${startDate}' AND ob.date <= '${endDate}'
  GROUP BY ob.campaign_id, ob.section_id
  ORDER BY ob.campaign_id
`);

module.exports = aggregateOBConversionReport;
