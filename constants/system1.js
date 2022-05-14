const mirror = require('../common/mirror');

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
  'total_spent',
  'revenue',
  'est_revenue',
  'pb_conversions',
  's1_conversions',
  'pb_search',
  'pb_impressions',
  'rpc',
  'est_roi',
  'profit',
  'est_profit',
  'live_cpa',
  'link_clicks',
  'ts_conversions',
  'fb_impressions',
  'cpa',
  'facebook_ctr',
  'cpc',
  'live_ctr',
  'cpm',
  'rpm',
]

module.exports = {
  SYSTEM1_BASE_URL,
  SYSTEM1_LABELS,
  SYSTEM1_MIRROR: mirror(SYSTEM1_LABELS),
  SYSTEM1_SHEET_VALUES
}
