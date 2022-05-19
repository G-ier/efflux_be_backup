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
  's1_last_updated',
  'roi',
  'est_roi'
]
};


module.exports = {  
  POSTBACK_SHEET_VALUES
}
