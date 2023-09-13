
const facebookRevealBotSheets = [
  {
    day: 8,
    spreadsheetId: '1A6Pfy2GPq0z12b_CtDdaMb5zKWecJa2jkzLVA3BwBuQ',
    sheetName: 'Campaign Last 7days',
    sheetNameByAdset:'Adset Last 7days',
    traffic_source: 'facebook',
  },
  {
    day: 4,
    spreadsheetId: '1A6Pfy2GPq0z12b_CtDdaMb5zKWecJa2jkzLVA3BwBuQ',
    sheetName: 'Campaign Last 3days',
    sheetNameByAdset:'Adset Last 3days',
    traffic_source: 'facebook',
  },
   {
    day: 2,
    spreadsheetId: '1A6Pfy2GPq0z12b_CtDdaMb5zKWecJa2jkzLVA3BwBuQ',
    sheetName: 'Campaign Yesterday',
    sheetNameByAdset:'Adset Yesterday',
    traffic_source: 'facebook',
  },
  {
    day: 1,
    spreadsheetId: '1A6Pfy2GPq0z12b_CtDdaMb5zKWecJa2jkzLVA3BwBuQ',
    sheetName: 'Campaign Today',
    sheetNameByAdset:'Adset Today',
    traffic_source: 'facebook',
  }
]

const tiktokRevealBotSheets = [
  {
    day: 8,
    spreadsheetId: '1RZ_ni_rHotKDRYiE4wsATVE5g4V0EpSpfuI973OkT1E',
    sheetName: 'Campaign Last 7days',
    sheetNameByAdset:'Adset Last 7days',
    traffic_source: 'tiktok',
  },
  {
    day: 4,
    spreadsheetId: '1RZ_ni_rHotKDRYiE4wsATVE5g4V0EpSpfuI973OkT1E',
    sheetName: 'Campaign Last 3days',
    sheetNameByAdset:'Adset Last 3days',
    traffic_source: 'tiktok',
  },
   {
    day: 2,
    spreadsheetId: '1RZ_ni_rHotKDRYiE4wsATVE5g4V0EpSpfuI973OkT1E',
    sheetName: 'Campaign Yesterday',
    sheetNameByAdset:'Adset Yesterday',
    traffic_source: 'tiktok',
  },
  {
    day: 1,
    spreadsheetId: '1RZ_ni_rHotKDRYiE4wsATVE5g4V0EpSpfuI973OkT1E',
    sheetName: 'Campaign Today',
    sheetNameByAdset:'Adset Today',
    traffic_source: 'tiktok',
  }
]

const revealBotCampaignSheetColumn = [
    'ad_account_name', 'time_zone', 'entity_name', 'campaign_id', 'status', 'daily_budget' ,'launch_date', 'amount_spent', 'impressions',
    'link_clicks', 'cpc_link_click', 'clicks_all', 'cpc_all', 'cpm', 'ctr_fb', 'results', 'cost_per_result', 'fb_last_update',

    'visitors', 'lander_visits', 'lander_searches', 'revenue_events', 'ctr_cr', 'rpc', 'rpm', 'rpv', 'publisher_revenue', 'cr_last_update',

    'tr_visits', 'tr_searches', 'tr_conversions', 'tr_ctr', 'cf_last_update',

    'pb_lander_conversions', 'pb_serp_conversions', 'pb_conversions', 'sheet_last_update'
]

const revealBotAdsetSheetColumn = [
  'ad_account_name', 'time_zone', 'entity_name', 'adset_id', 'status', 'daily_budget','launch_date', 'amount_spent', 'impressions',
  'link_clicks', 'cpc_link_click', 'clicks_all', 'cpc_all', 'cpm', 'ctr_fb', 'results', 'cost_per_result', 'fb_last_update',

  'visitors', 'lander_visits', 'lander_searches', 'revenue_events', 'ctr_cr', 'rpc', 'rpm', 'rpv', 'publisher_revenue', 'cr_last_update',

  'tr_visits', 'tr_searches', 'tr_conversions', 'tr_ctr', 'cf_last_update',

  'pb_lander_conversions', 'pb_serp_conversions', 'pb_conversions', 'sheet_last_update'
]

module.exports = {
  facebookRevealBotSheets,
  tiktokRevealBotSheets,
  revealBotCampaignSheetColumn,
  revealBotAdsetSheetColumn
}
