const db = require('../../data/dbConfig');
const selects = require("./selects");

const aggregateSystem1ConversionReport = (startDate, endDate, groupBy) => db.raw(
  `SELECT s1.${groupBy},
      CAST(SUM(s1.revenue)::decimal AS FLOAT) as revenue,
      CAST(SUM(s1.searches) AS INTEGER) as searches,
      CAST(SUM(s1.clicks) AS INTEGER) as revenue_clicks,
      CAST(SUM(s1.total_visitors) AS INTEGER) as visitors,
      CASE WHEN SUM(s1.clicks) = 0 THEN NULL ELSE CAST(SUM(s1.revenue)::decimal AS FLOAT) / SUM(s1.clicks) END as rpc,
      MAX(s1.campaign) as s1_camp_name
  FROM system1 as s1
  WHERE s1.date > '${startDate}' AND s1.date <= '${endDate}'
  GROUP BY s1.${groupBy};`
  );

module.exports = aggregateSystem1ConversionReport;
