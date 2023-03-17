const db = require("../../data/dbConfig");

function clickflareCampaigns(startDate, endDate, traffic_source, groupBy, groupByName) {
  return db.raw(`
    SELECT cf.${groupBy} as ${groupBy},
    MAX(cf.${groupByName}) as ${groupByName},
    CAST(ROUND(SUM(cf.revenue)::decimal, 2) AS FLOAT) as revenue,
    CAST(COUNT(CASE WHEN cf.event_type = 'visit' THEN 1 ELSE null END) AS INTEGER) as visits,
    CAST(COUNT(CASE WHEN cf.event_type = 'click' THEN 1 ELSE null END) AS INTEGER) as clicks,
    CAST(COUNT(CASE WHEN cf.event_type = 'conversion' THEN 1 ELSE null END) AS INTEGER) as conversions
    FROM clickflare cf
    WHERE cf.date > '${startDate}' AND cf.date <= '${endDate}' AND cf.traffic_source = '${traffic_source}'
    GROUP BY cf.${groupBy}
  `)
}

module.exports = {
  clickflareCampaigns
}
