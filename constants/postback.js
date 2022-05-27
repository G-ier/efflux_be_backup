const POSTBACK_SHEET_VALUES = (groupBy) => {
  return [
    'ad_account_name',
    'time_zone',
    'campaign_name',
    groupBy,
    'status',
    'date',
    'amount_spent',
    'last_updated',
    'pb_conversion',
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
    'sd_pb_revenue', // sedo postback
    'sd_pb_conversion',
    'ave_revenue',
    'ave_conversion',
    'ave_revenue_y',
    'ave_conversion_y',
  ]
};

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
  'sd_pb_revenue', // sedo postback
  'sd_pb_conversion',
  'ave_revenue',
  'ave_conversion',
  'ave_revenue_y',
  'ave_conversion_y',
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
    campaign: 's1_campaign',
    campaign_y: 's1_campaign_y',
    revenue: 's1_revenue',
    revenue_y: 's1_revenue_y',
    conversion: 's1_conversion',
    conversion_y: 's1_conversion_y',
  },
  sedo: {
    campaign: 's1_campaign',
    campaign_y: 's1_campaign_y',
    revenue: 's1_revenue',
    revenue_y: 's1_revenue_y',
    conversion: 's1_conversion',
    conversion_y: 's1_conversion_y',
  }
}
module.exports = {
  POSTBACK_SHEET_VALUES,
  POSTBACK_EXCLUDEDFIELDS,
  pbNetMapFields,
}
