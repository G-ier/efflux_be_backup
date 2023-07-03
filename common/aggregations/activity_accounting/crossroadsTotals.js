const db                    = require('../../../data/dbConfig');

function crossroadsTotals(startDate, endDate) {

  let query = `
    SELECT
        cr.date,
        SUM(CASE WHEN cr.traffic_source = 'facebook' THEN cr.total_revenue ELSE 0 END) as fb_revenue,
        SUM(CASE WHEN cr.traffic_source = 'tiktok' THEN cr.total_revenue ELSE 0 END) as tiktok_revenue,
        SUM(cr.total_revenue) as total_revenue
    FROM
        crossroads_partitioned cr
    WHERE cr.date > '${startDate}' AND cr.date <= '${endDate}'
    GROUP BY cr.date
    ORDER BY cr.date;
  `

  return db.raw(query)
}

module.exports = crossroadsTotals;
