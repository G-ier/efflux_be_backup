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
  's1_conversion',
  'rpc',
  'revenue',
  'est_revenue',
  's1_last_updated',
  'profit',
  'est_profit',
  'roi',
  'est_roi',
  'yt_rpc',
  'yt_revenue',
  's1_yt_conversion'
]
};

const POSTBACK_EXCLUDEDFIELDS = [
  'yt_rpc',
  'yt_revenue',
  's1_yt_conversion'
]

module.exports = {  
  POSTBACK_SHEET_VALUES,
  POSTBACK_EXCLUDEDFIELDS
}
