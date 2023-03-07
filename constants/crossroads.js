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

const CROSSROADSDATA_SHEET_VALUES = [
  'revenue',
  'searches',
  'lander_visits',
  'revenue_clicks',
  'visitors',
  'tracked_visitors',
  'cr_rpm',
  'cr_rpc',
  'cr_camp_name',
]

const CROSSROADS_TODAY_HOURLY_DATA_SHEET_VALUES = [
  'spend_today',
  'revenue_today',
  'revenue_clicks_today',
  'roi_today',
  'spend_yesterday',
  'revenue_yesterday',
  'revenue_clicks_yesterday',
  'roi_yesterday',
  'spend_2_days_ago',
  'revenue_2_days_ago',
  'revenue_clicks_2_days_ago',
  'roi_2_days_ago',
  'spend_3_days_ago',
  'revenue_3_days_ago',
  'revenue_clicks_3_days_ago',
  'roi_3_days_ago',
]
const CROSSROADS_ACCOUNTS = [
  {
    id: 'account-1',
    key: '1a3c3ae4-2755-450d-ac24-8d10371910c5',
  }
];

const sheetsArr = [
  {
    day: 8,
    spreadsheetId: '1bHmSnTCWRLO5kzMuzuZxc2MVcyaS-eVTtE0w0XisCbs',
    sheetName: 'Campaign Last 7days',
    sheetNameByAdset:'Adset Last 7days',
    traffic_source: 'facebook',
  },
  {
    day: 4,
    spreadsheetId: '1bHmSnTCWRLO5kzMuzuZxc2MVcyaS-eVTtE0w0XisCbs',
    sheetName: 'Campaign Last 3days',
    sheetNameByAdset:'Adset Last 3days',
    traffic_source: 'facebook',
  },
  {
    day: 2,
    spreadsheetId: '1bHmSnTCWRLO5kzMuzuZxc2MVcyaS-eVTtE0w0XisCbs',
    sheetName: 'Campaign Yesterday',
    sheetNameByAdset:'Adset Yesterday',
    traffic_source: 'facebook',
  },
  {
    day: 8,
    spreadsheetId: '1LXkbP4X-uUGl_Fk5AKciL0DvQSbFN_apJga-x3g0_t4',
    sheetName: 'Campaign Last 7days',
    sheetNameByAdset:'Adset Last 7days',
    traffic_source: 'tiktok',
  },
  {
    day: 4,
    spreadsheetId: '1LXkbP4X-uUGl_Fk5AKciL0DvQSbFN_apJga-x3g0_t4',
    sheetName: 'Campaign Last 3days',
    sheetNameByAdset:'Adset Last 3days',
    traffic_source: 'tiktok',
  },
  {
    day: 2,
    spreadsheetId: '1LXkbP4X-uUGl_Fk5AKciL0DvQSbFN_apJga-x3g0_t4',
    sheetName: 'Campaign Yesterday',
    sheetNameByAdset:'Adset Yesterday',
    traffic_source: 'tiktok',
  },
]
const todaySheetsArr = [
  {
    hour: -2,
    spreadsheetId: '1bHmSnTCWRLO5kzMuzuZxc2MVcyaS-eVTtE0w0XisCbs',
    sheetName: 'Campaign Today',
    sheetNameByAdset:'Adset Today',
    traffic_source: 'facebook',
  },
  {
    hour: -2,
    spreadsheetId: '1LXkbP4X-uUGl_Fk5AKciL0DvQSbFN_apJga-x3g0_t4',
    sheetName: 'Campaign Today',
    sheetNameByAdset:'Adset Today',
    traffic_source: 'tiktok',
  },
    // {
    //   hour: -2,  // testing
    //   spreadsheetId: '1bHmSnTCWRLO5kzMuzuZxc2MVcyaS-eVTtE0w0XisCbs',
    //   sheetName: 'Local Campaign Today',
    //   sheetNameByAdset:'Local Adset Today',
    //   traffic_source: 'facebook',
    // },
]
const hourlySheetArr = [
  {
    spreadsheetId: '1PqFLxtWzj8N4BAeyL0G8GWOBcXhDUwzl_tCw-QkvtLE',
    sheetName: 'Campaign',
    sheetNameByAdset:'Adset',
    traffic_source: 'facebook',
  },
    // {
    //   hour: -2,  // testing
    //   spreadsheetId: '1bHmSnTCWRLO5kzMuzuZxc2MVcyaS-eVTtE0w0XisCbs',
    //   sheetName: 'Local Campaign Today',
    //   sheetNameByAdset:'Local Adset Today',
    //   traffic_source: 'facebook',
    // },
]
module.exports = {
  CROSSROADS_URL,
  CROSSROADS_LABELS,
  CROSSROADS_MIRROR: mirror(CROSSROADS_LABELS),
  CROSSROADS_ACCOUNTS,
  CROSSROADS_SHEET_VALUES,
  CROSSROADSDATA_SHEET_VALUES,
  CROSSROADS_TODAY_HOURLY_DATA_SHEET_VALUES,
  sheetsArr,
  todaySheetsArr,
  hourlySheetArr
};
