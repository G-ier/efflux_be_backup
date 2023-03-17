const CLICKFLARE_URL = 'https://api.clickflare.io/api/';
const API_KEY = '7af4a2fa1d29f14c6359238362cbc439423358f95445ba859a23b2b678140e2b.60c17b1fd0de84655a648c9aceef873842558757';
const clickflareTimezone = 'America/Los_Angeles';

const sheetsArr = [
  {
    day: 8,
    spreadsheetId: '1J7-neUUgaN9rgcKFSTIJ7RHY-tlFwDLz3biD2g2M-P8',
    sheetName: 'Campaign Last 7days',
    sheetNameByAdset:'Adset Last 7days',
    traffic_source: 'facebook',
  },
  {
    day: 4,
    spreadsheetId: '1J7-neUUgaN9rgcKFSTIJ7RHY-tlFwDLz3biD2g2M-P8',
    sheetName: 'Campaign Last 3days',
    sheetNameByAdset:'Adset Last 3days',
    traffic_source: 'facebook',
  },
  {
    day: 2,
    spreadsheetId: '1J7-neUUgaN9rgcKFSTIJ7RHY-tlFwDLz3biD2g2M-P8',
    sheetName: 'Campaign Yesterday',
    sheetNameByAdset:'Adset Yesterday',
    traffic_source: 'facebook',
  },
  {
    day: 1,
    spreadsheetId: '1J7-neUUgaN9rgcKFSTIJ7RHY-tlFwDLz3biD2g2M-P8',
    sheetName: 'Campaign Today',
    sheetNameByAdset:'Adset Today',
    traffic_source: 'facebook',
  },
  {
    day: 8,
    spreadsheetId: '1AB30beLpmj8tQ6v-AnTF23k6rHtljcH6lQ94UnMW_gA',
    sheetName: 'Campaign Last 7days',
    sheetNameByAdset:'Adset Last 7days',
    traffic_source: 'tiktok',
  },
  {
    day: 4,
    spreadsheetId: '1AB30beLpmj8tQ6v-AnTF23k6rHtljcH6lQ94UnMW_gA',
    sheetName: 'Campaign Last 3days',
    sheetNameByAdset:'Adset Last 3days',
    traffic_source: 'tiktok',
  },
  {
    day: 2,
    spreadsheetId: '1AB30beLpmj8tQ6v-AnTF23k6rHtljcH6lQ94UnMW_gA',
    sheetName: 'Campaign Yesterday',
    sheetNameByAdset:'Adset Yesterday',
    traffic_source: 'tiktok',
  },
  {
    day: 1,
    spreadsheetId: '1AB30beLpmj8tQ6v-AnTF23k6rHtljcH6lQ94UnMW_gA',
    sheetName: 'Campaign Today',
    sheetNameByAdset:'Adset Today',
    traffic_source: 'tiktok',
  },
]

const CLICKFLAREDATA_SHEET_VALUES = [
  'revenue',
  'visits',
  'clicks',
  'conversions',
]
module.exports = {
  CLICKFLARE_URL,
  API_KEY,
  clickflareTimezone,
  sheetsArr,
  CLICKFLAREDATA_SHEET_VALUES
}
