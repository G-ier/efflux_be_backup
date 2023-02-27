const db = require('../../data/dbConfig');
const {
  dayYMD, yesterdayYMD, dayYMDHM, yesterdayYMDHM,
} = require('../day');

const aggregatePostbackConversionByTrafficReport = (startDate, endDate, groupBy, network, traffic_source) => db.raw(`
  SELECT pb.${groupBy},
  MAX(pb.campaign_name) as campaign_name,
  MAX(pb.traffic_source) as traffic_source,
  SUM(pb.pb_value) as revenue,
  CAST(COUNT(pb.event_type) AS INTEGER) as conversions
  FROM postback_events pb
  WHERE pb.date > '${startDate}'
    AND pb.date <= '${endDate}'
    AND pb.traffic_source = '${traffic_source}'
    AND network = '${network}'
    AND event_type = 'Purchase'
  GROUP BY pb.${groupBy}
`)

module.exports = aggregatePostbackConversionByTrafficReport;
