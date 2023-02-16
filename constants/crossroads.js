const mirror = require('../common/mirror');

const CROSSROADS_URL = 'https://crossroads.domainactive.com/api/v2/';

const CROSSROADS_LABELS = {
  cr_campaign_id: 'Campaign ID (tg2)',
  cr_visitors: 'Visitors',
  cr_lander_visits: 'Lander visits',
  cr_searches: 'Lander searches',
  cr_revenue_clicks: 'Revenue events',
  cr_ctr: 'CTR(CR)',
  cr_rpv: 'rpv',
  cr_rpc: 'rpc',
  cr_rpm: 'rpm',
  cr_revenue: 'Revenue',
};

const CROSSROADS_SHEET_VALUES = [
  'total_spent',
  'revenue',
  'est_revenue',
  'pb_conversions',
  'cr_conversions',
  'live_cpa',
  'rpc',
  'roi',
  'est_roi',
  'profit',
  'est_profit',
  'link_clicks',
  'pb_unique_conversions',
  'cr_unique_conversions',
  'ts_conversions',
  'fb_impressions',
  'cpa',
  'facebook_ctr',
  'rpi',
  'unique_cpa',
  'cpc',
  'live_ctr',
  'unique_rpc',
  'cpm',
  'rpm',
  'visitors'
]

const CROSSROADS_ACCOUNTS = [
  {
    id: 'account-1',
    key: '1a3c3ae4-2755-450d-ac24-8d10371910c5',
  }
];

module.exports = {
  CROSSROADS_URL,
  CROSSROADS_LABELS,
  CROSSROADS_MIRROR: mirror(CROSSROADS_LABELS),
  CROSSROADS_ACCOUNTS,
  CROSSROADS_SHEET_VALUES
};
