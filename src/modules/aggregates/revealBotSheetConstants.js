const EnvironmentVariablesManager = require('../../shared/services/EnvironmentVariablesManager');
const environment = EnvironmentVariablesManager.getEnvVariable('CRON_ENVIRONMENT') === 'production' ? 'prod' : 'staging';

const fbCrRevealBotSheetId = environment === 'prod'
    ? '1A6Pfy2GPq0z12b_CtDdaMb5zKWecJa2jkzLVA3BwBuQ'
    : '1Wwj22EkteaOCyRUVpSRXtjt0J2K3sTEBR-j3Lpbgb7E'

const facebookRevealBotSheets = [
  {
    day: 8,
    spreadsheetId: fbCrRevealBotSheetId,
    sheetName: 'Campaign Last 7days',
    sheetNameByAdset:'Adset Last 7days',
    traffic_source: 'facebook',
  },
  {
    day: 4,
    spreadsheetId: fbCrRevealBotSheetId,
    sheetName: 'Campaign Last 3days',
    sheetNameByAdset:'Adset Last 3days',
    traffic_source: 'facebook',
  },
   {
    day: 2,
    spreadsheetId: fbCrRevealBotSheetId,
    sheetName: 'Campaign Yesterday',
    sheetNameByAdset:'Adset Yesterday',
    traffic_source: 'facebook',
  },
  {
    day: 1,
    spreadsheetId: fbCrRevealBotSheetId,
    sheetName: 'Campaign Today',
    sheetNameByAdset:'Adset Today',
    traffic_source: 'facebook',
  }
]

const fbSedoRevealBotSheetId = environment === 'prod'
    ? '1IPhXe2uVAN-WVgEQeaZv59ewRBiOFdfuI4IpcxYqbW4'
    : 'ZMx4db1MrmIDHn-Yr2V8SzML8RGLO7vSLZ571IVm8cU'

const facebookFFSedoRevealBotSheets = [
  {
    // 1ZMx4db1MrmIDHn-Yr2V8SzML8RGLO7vSLZ571IVm8cU   - Test Sheet
    // 1IPhXe2uVAN-WVgEQeaZv59ewRBiOFdfuI4IpcxYqbW4   - Prod Sheet
    day: 8,
    spreadsheetId: fbSedoRevealBotSheetId,
    sheetName: 'Campaign Last 7days',
    sheetNameByAdset:'Adset Last 7days',
    traffic_source: 'facebook',
  },
  {
    day: 4,
    spreadsheetId: fbSedoRevealBotSheetId,
    sheetName: 'Campaign Last 3days',
    sheetNameByAdset:'Adset Last 3days',
    traffic_source: 'facebook',
  },
   {
    day: 2,
    spreadsheetId: fbSedoRevealBotSheetId,
    sheetName: 'Campaign Yesterday',
    sheetNameByAdset:'Adset Yesterday',
    traffic_source: 'facebook',
  },
  {
    day: 1,
    spreadsheetId: fbSedoRevealBotSheetId,
    sheetName: 'Campaign Today',
    sheetNameByAdset:'Adset Today',
    traffic_source: 'facebook',
  }
]

const tikTokCrRevealBotSheetId = environment === 'prod'
    ? '1RZ_ni_rHotKDRYiE4wsATVE5g4V0EpSpfuI973OkT1E'
    : '1R3lKaff98pUknkEL2c4LcZs7lQkE-eugY1v1CxvM224'

const tiktokRevealBotSheets = [
  {
    day: 8,
    spreadsheetId: tikTokCrRevealBotSheetId,
    sheetName: 'Campaign Last 7days',
    sheetNameByAdset:'Adset Last 7days',
    traffic_source: 'tiktok',
  },
  {
    day: 4,
    spreadsheetId: tikTokCrRevealBotSheetId,
    sheetName: 'Campaign Last 3days',
    sheetNameByAdset:'Adset Last 3days',
    traffic_source: 'tiktok',
  },
   {
    day: 2,
    spreadsheetId: tikTokCrRevealBotSheetId,
    sheetName: 'Campaign Yesterday',
    sheetNameByAdset:'Adset Yesterday',
    traffic_source: 'tiktok',
  },
  {
    day: 1,
    spreadsheetId: tikTokCrRevealBotSheetId,
    sheetName: 'Campaign Today',
    sheetNameByAdset:'Adset Today',
    traffic_source: 'tiktok',
  }
]

const tiktokFFSedoRevealbotSheetId = environment === 'prod'
    ? '1-4GVEBkwA7atL2PUkl_XBD1g9aqlWwt5-iWAZdm6pV8'
    : '1fptls4D3f-eQZ47vXg8rjBzgDQh-H3S1C8Ly2dcYzGY'

const tiktokFFSedoRevealbotSheets = [
  {
    day: 8,
    spreadsheetId: tiktokFFSedoRevealbotSheetId,
    sheetName: 'Campaign Last 7days',
    sheetNameByAdset:'Adset Last 7days',
    traffic_source: 'tiktok',
  },
  {
    day: 4,
    spreadsheetId: tiktokFFSedoRevealbotSheetId,
    sheetName: 'Campaign Last 3days',
    sheetNameByAdset:'Adset Last 3days',
    traffic_source: 'tiktok',
  },
   {
    day: 2,
    spreadsheetId: tiktokFFSedoRevealbotSheetId,
    sheetName: 'Campaign Yesterday',
    sheetNameByAdset:'Adset Yesterday',
    traffic_source: 'tiktok',
  },
  {
    day: 1,
    spreadsheetId: tiktokFFSedoRevealbotSheetId,
    sheetName: 'Campaign Today',
    sheetNameByAdset:'Adset Today',
    traffic_source: 'tiktok',
  }
]

const revealBotCampaignSheetColumn = [
    'ad_account_name', 'time_zone', 'entity_name', 'campaign_id', 'status', 'daily_budget' ,'launch_date', 'amount_spent', 'impressions',
    'link_clicks', 'cpc_link_click', 'clicks_all', 'cpc_all', 'cpm', 'ctr_fb', 'results', 'cost_per_result', 'ts_last_update',

    'visitors', 'lander_visits', 'lander_searches', 'revenue_events', 'ctr_cr', 'rpc', 'rpm', 'rpv', 'publisher_revenue', 'nw_last_update',

    'tr_visits', 'tr_searches', 'tr_conversions', 'tr_ctr', 'cf_last_update',

    'pb_lander_conversions', 'pb_serp_conversions', 'pb_conversions', 'sheet_last_update'
]

const revealBotAdsetSheetColumn = [
  'ad_account_name', 'time_zone', 'entity_name', 'adset_id', 'status', 'daily_budget','launch_date', 'amount_spent', 'impressions',
  'link_clicks', 'cpc_link_click', 'clicks_all', 'cpc_all', 'cpm', 'ctr_fb', 'results', 'cost_per_result', 'ts_last_update',

  'visitors', 'lander_visits', 'lander_searches', 'revenue_events', 'ctr_cr', 'rpc', 'rpm', 'rpv', 'publisher_revenue', 'nw_last_update',

  'tr_visits', 'tr_searches', 'tr_conversions', 'tr_ctr', 'cf_last_update',

  'pb_lander_conversions', 'pb_serp_conversions', 'pb_conversions', 'sheet_last_update'
]

module.exports = {
  facebookRevealBotSheets,
  tiktokRevealBotSheets,
  tiktokFFSedoRevealbotSheets,
  facebookFFSedoRevealBotSheets,
  revealBotCampaignSheetColumn,
  revealBotAdsetSheetColumn
}
