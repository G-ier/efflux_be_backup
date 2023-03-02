const db = require("../../data/dbConfig");

function aggregateSedoConversion1Report(startDate, endDate, groupBy) {
  return db.raw(`
  SELECT sd.${groupBy},
  MAX(sd.domain) as domain,
  CAST(SUM(sd.visitors) AS INTEGER) as visitors,
  CAST(SUM(sd.clicks) AS INTEGER) as revenue_clicks,
  CAST(ROUND(SUM(sd.earnings)::decimal, 2) AS FLOAT) as revenue
  FROM sedo sd
  WHERE sd.date > '${startDate}'
    AND sd.date <= '${endDate}'
  GROUP BY sd.${groupBy}
`)
}

module.exports = aggregateSedoConversion1Report;
