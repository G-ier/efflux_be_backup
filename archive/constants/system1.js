const mirror = require('../archive/common/mirror');

const SYSTEM1_BASE_URL = 'https://reports.openmail.com'

const SYSTEM1_LABELS = {
  date: 'Date',
  campaign: 'Campaign',
  sub_id: 'Sub ID',
  total_visitors: 'Total Sessions',
  searches: 'Searches',
  clicks: 'Clicks',
  revenue: 'Estimated Revenue'
}

const SYSTEM1_SHEET_VALUES = [
  'revenue',
  'searches',
  'lander_visits',
  'revenue_clicks',
  'visitors',
  'tracked_visitors',
  'rpm',
  'rpc',
  's1_camp_name'
]


module.exports = {
  SYSTEM1_BASE_URL,
  SYSTEM1_LABELS,
  SYSTEM1_MIRROR: mirror(SYSTEM1_LABELS),
  SYSTEM1_SHEET_VALUES
}
