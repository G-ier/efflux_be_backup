const db                    = require('../../../data/dbConfig');


function crossroadsTotalsByMediaBuyer(startDate, endDate, mediaBuyer) {

  const mediaBuyerCondition = mediaBuyer
  ? `AND u.id = ${mediaBuyer}`
  : '';

  let query = `
  SELECT
    cr.date,
    COALESCE(u.name, 'unknown') AS media_buyer,
    SUM(CASE WHEN cr.traffic_source = 'facebook' THEN cr.total_revenue ELSE 0 END) as fb_revenue,
    SUM(CASE WHEN cr.traffic_source = 'tiktok' THEN cr.total_revenue ELSE 0 END) as tiktok_revenue,
    SUM(cr.total_revenue) as total_revenue
  FROM users u
    FULL OUTER JOIN campaigns c ON u.id = c.user_id
    FULL OUTER JOIN crossroads_partitioned cr ON c.id = cr.campaign_id
  WHERE cr.date > '${startDate}' AND cr.date <= '${endDate}'
    ${mediaBuyerCondition}
  GROUP BY cr.date, media_buyer
  ORDER BY cr.date, media_buyer
  `

  return db.raw(query)
};


module.exports = crossroadsTotalsByMediaBuyer;
