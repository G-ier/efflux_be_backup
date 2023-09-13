const POSTBACK_SHEET_VALUES = (groupBy) => {
  return [
    'ad_account_name',
    'time_zone',
    'campaign_name',
    groupBy,
    'status',
    'date',
    'amount_spent',
    'elapsed_time',
    'pb_conversion',
    'pb_payout',
    'pb_last_updated',
    'nt_conversion',
    'rpc',
    'revenue',
    'est_revenue',
    'profit',
    'est_profit',
    'roi',
    'est_roi',
    'live_cpa',
    'ave_rpc',
    'network',
    'link_clicks',
    'fb_impressions',
    'fb_conversions',
    'fb_lead',
    'fb_conversion_amount',
    's1_campaign', // s1
    's1_revenue',
    's1_conversion',
    's1_last_updated',
    's1_campaign_y', // s1 yesterday
    's1_revenue_y',
    's1_conversion_y',
    's1_pb_conversion',  // s1 postback
    's1_pb_last_updated',
    'sd_last_updated', // sedo
    'sd_conversion', // sedo
    'sd_revenue', // sedo
    'sd_campaign',
    'sd_conversion_y',
    'sd_revenue_y',
    'sd_campaign_y',
    'sd_pb_revenue', // sedo postback
    'sd_pb_conversion',
    'sd_pb_last_updated',
    'ave_revenue',
    'ave_conversion',
    'ave_revenue_y',
    'ave_conversion_y',
    'last_updated',
  ]
};

const PB_TIMEZONE = 'America/Los_Angeles';
const POSTBACK_EXCLUDEDFIELDS = [
  's1_campaign', // s1
  's1_revenue',
  's1_conversion',
  's1_last_updated',
  's1_campaign_y', // s1 yesterday
  's1_revenue_y',
  's1_conversion_y',
  's1_pb_conversion',  // s1 postback
  's1_pb_last_updated',
  'sd_last_updated', // sedo
  'sd_conversion', // sedo
  'sd_revenue', // sedo
  'sd_campaign',
  'sd_conversion_y',
  'sd_revenue_y',
  'sd_campaign_y',
  'sd_campaign',
  'sd_pb_revenue', // sedo postback
  'sd_pb_conversion',
  'sd_pb_last_updated',
  'ave_revenue',
  'ave_conversion',
  'ave_revenue_y',
  'ave_conversion_y',
  'fb_lead',
]

const pbNetMapFields = {
  system1: {
    campaign: 's1_campaign',
    campaign_y: 's1_campaign_y',
    revenue: 's1_revenue',
    revenue_y: 's1_revenue_y',
    conversion: 's1_conversion',
    conversion_y: 's1_conversion_y',
  },
  crossroads: {
    campaign: 'cr_campaign',
    campaign_y: 'cr_campaign_y',
    revenue: 'cr_revenue',
    revenue_y: 'cr_revenue_y',
    conversion: 'cr_conversion',
    conversion_y: 'cr_conversion_y',
  },
  unknown: {
    campaign: 'sd_campaign',
    campaign_y: 'sd_campaign_y',
    revenue: 'sd_revenue',
    revenue_y: 'sd_revenue_y',
    conversion: 'sd_conversion',
    conversion_y: 'sd_conversion_y',
  }
}

const sheetsArr = [
  {
    network: 'system1',
    timezone: 'UTC',
    spreadsheetId:"17UZgfakONENIwmR5qQL_betjWxnPHzi5cYGOFzghhoo",
    sheetName:"Campaign", //Sean
    sheetNameByAdset:"Adset",
    sheetName_Y:"Campaign For Yesterday",
    sheetNameByAdset_Y: "Adset For Yesterday",
    accounts: [
      '457104922468676',
      '331918771765149',
      '1161945751010436',
      '633235807758573',
      '995674611312775',
      '514891343712186',
    ]
  },
  {
    network: 'system1',
    timezone: 'UTC',
    spreadsheetId:"13bqIaR5dMC3OjlKAAeJpRQWbrTViUZOZk9_3P1gNL2k",
    sheetName:"Campaign", // Patrick
    sheetNameByAdset:"Adset",
    sheetName_Y:"Campaign For Yesterday",
    sheetNameByAdset_Y: "Adset For Yesterday",
    accounts:[
      '1034095180851493',
      '1203724037104268',
      '674170930541058',
      '502814237897602',
      '846097499367741',
      '957442114827495',
      '1201450900278028'
    ]
  },
  {
    network: 'unknown',
    timezone: process.env.SEDO_TIMEZONE,
    spreadsheetId:"1dJFEgKe_eGwV9_xa9hNtY9-dk7qA-oJpAhasHrxqlmE",
    sheetName:"Campaign", // sedo
    sheetNameByAdset:"Adset",
    sheetName_Y:"Campaign For Yesterday",
    sheetNameByAdset_Y: "Adset For Yesterday",
    accounts:[
      '699028961232077',
      '347091310767011',
      '3229297027345837'
    ]
  },
  {
    network: 'system1',
    timezone: 'UTC',
    spreadsheetId:"1qg1RO6iNatq2hGIIX9zJHIlF9ZR0kUYWucV_ryQEiJg",
    sheetName:"Campaign", // utc14
    sheetNameByAdset:"Adset",
    sheetName_Y:"Campaign For Yesterday",
    sheetNameByAdset_Y: "Adset For Yesterday",
    accounts:[
      '995674611312775'
    ]
  },
  {
    network: 'crossroads',
    timezone: 'America/Los_Angeles',
    spreadsheetId:"1TTRitP_kKzaQhVyE6nCztjPiitUoJ-I6lOg92s7RBdA",
    sheetName:"Campaign", // crossroads
    sheetNameByAdset:"Adset",
    sheetName_Y:"Campaign For Yesterday",
    sheetNameByAdset_Y: "Adset For Yesterday",
    accounts:[
      '757173685396824',
    ]
  },

  // test

  // {
  //   network: 'system1', // local development
  //   timezone: 'UTC',
  //   spreadsheetId:"112mVXGcbs1ckvua44OcEyUl9_MexD6cUjPefOEYod3o",
  //   sheetName:"Campaign", //Sean
  //   sheetNameByAdset:"Adset",
  //   sheetName_Y:"Campaign For Yesterday",
  //   sheetNameByAdset_Y: "Adset For Yesterday",
  //   accounts: [
  //     '457104922468676',
  //     '331918771765149',
  //     '1161945751010436',
  //     '633235807758573',
  //     '995674611312775',
  //     '514891343712186',
  //   ]
  // },
  // {
  //   network: 'system1', // local development
  //   timezone: 'UTC',
  //   spreadsheetId:"112mVXGcbs1ckvua44OcEyUl9_MexD6cUjPefOEYod3o",
  //   sheetName:"Campaign", //Sean
  //   sheetNameByAdset:"Adset",
  //   sheetName_Y:"Campaign For Yesterday",
  //   sheetNameByAdset_Y: "Adset For Yesterday",
  //   accounts: [
  //     '457104922468676',
  //     '331918771765149',
  //     '1161945751010436',
  //     '633235807758573'
  //   ]
  // },
]

const unknownSheetArr = [
  {
    table: 'system1',
    spreadsheetId:"1oTrQRVA0xF6NU96NpCN9938N7XwB3Caw6cRTToZZwRw",
    sheetName:"System1 Unknown",
    excludedFields: ['id', 'created_at', 'utc_hour', 'last_updated']
  },
  {
    table: 's1_conversions',
    spreadsheetId:"1oTrQRVA0xF6NU96NpCN9938N7XwB3Caw6cRTToZZwRw",
    sheetName:"S1 Postback Unknown",
    excludedFields: ['id', 'created_at', 'fbclid','event_time','event_id','posted_to_ts', 'fbc', 'referrer_url', 'gclid', 'rskey', 'hour']
  },
  {
    table: 'sedo',
    spreadsheetId:"1oTrQRVA0xF6NU96NpCN9938N7XwB3Caw6cRTToZZwRw",
    sheetName:"Sedo Unknown",
    excludedFields: ['id', 'created_at', ]
  },
  {
    table: 'sedo_conversions',
    spreadsheetId:"1oTrQRVA0xF6NU96NpCN9938N7XwB3Caw6cRTToZZwRw",
    sheetName:"Sedo Postback Unknown",
    excludedFields: ['id', 'created_at', ]
  },
]

const PB_SHEETS = [
  {
    network: 'crossroads',
    timezone: PB_TIMEZONE,
    spreadsheetId:"1D-66Tf5VcQGghBkpukNgsNmKe8nHFyMTOsIwe5RnNtk",
    sheetName: "Campaign",
    sheetNameByAdset: "Adset",
    traffic: 'facebook',
    fromDay: 1,
    toDay: 0,
  },
  {
    network: 'crossroads',
    timezone: PB_TIMEZONE,
    spreadsheetId:"1D-66Tf5VcQGghBkpukNgsNmKe8nHFyMTOsIwe5RnNtk",
    sheetName: "Campaign Yesterday",
    sheetNameByAdset: "Adset Yesterday",
    traffic: 'facebook',
    fromDay: 2,
    toDay: 1,
  },
  {
    network: 'crossroads',
    timezone: PB_TIMEZONE,
    spreadsheetId:"190Lf-lxTnihSO0mtzSYlX-OYNmuOp4JKGrZxykETnpI",
    sheetName: "Campaign",
    sheetNameByAdset: "Adset",
    traffic: 'tiktok',
    fromDay: 1,
    toDay: 0,
  },
  {
    network: 'crossroads',
    timezone: PB_TIMEZONE,
    spreadsheetId:"190Lf-lxTnihSO0mtzSYlX-OYNmuOp4JKGrZxykETnpI",
    sheetName: "Campaign Yesterday",
    sheetNameByAdset: "Adset Yesterday",
    traffic: 'tiktok',
    fromDay: 2,
    toDay: 1,
  },
]

const PB_SHEET_VALUES = [
  'revenue',
  'conversions',
  'rpc',
  'traffic_source'
]
module.exports = {
  POSTBACK_SHEET_VALUES,
  POSTBACK_EXCLUDEDFIELDS,
  pbNetMapFields,
  sheetsArr,
  unknownSheetArr,
  PB_SHEETS,
  PB_SHEET_VALUES,
  PB_TIMEZONE
}
