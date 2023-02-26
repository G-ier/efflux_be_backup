const db = require('../../data/dbConfig');
const {
  dayYMD, yesterdayYMD, dayYMDHM, yesterdayYMDHM,
} = require('../day');

const aggregatePostbackConversionByTrafficReport = (startDate, endDate, network, traffic_source) => db.raw(`
  SELECT pb.campaign_id as campaign_id,
  MAX(pb.campaign_name) as campaign_name,
  MAX(pb.traffic_source) as traffic_source,
  SUM(pb.pb_value) as revenue,
  COUNT(pb.event_type) as conversions,
  FROM postback_events pb
  WHERE pb.date > '${startDate}'
    AND pb.date <= '${endDate}'
    AND pb.traffic_source = '${traffic_source}'
    AND network = '${network}'
  GROUP BY pb.campaign_id
`)

module.exports = aggregatePostbackConversionByTrafficReport;
