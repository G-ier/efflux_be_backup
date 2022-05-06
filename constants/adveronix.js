const mirror = require('../common/mirror');

const ADVERONIX_KEYMAP = {
  'Account': 'adv_acocunt',
  'Campaign ID': 'adv_campaign_id',
  'Campaign': 'adv_campaign',
  'Cost': 'adv_cost',
  'Impressions': 'adv_impressions',
  'CTR': 'adv_ctr',
  'Clicks': 'adv_clicks',
  'Avg. CPC': 'adv_avg_cpc',
  'Conversions': 'adv_conversions',
  'Cost / conv.': 'adv_cpc',
}

const ADV_GDN_KEYMAP = {
  'adv_acocunt': 'account_id',
  'adv_campaign_id': 'campaign_id',
  'adv_campaign': 'campaign_name',
  'adv_cost': 'total_spent',
  'adv_impressions': 'impressions',
  // 'adv_ctr': 'ctr',
  'adv_clicks': 'link_clicks',
  // 'adv_avg_cpc': null,
  'adv_conversions': 'conversions',
  'adv_cpc': 'cpc',
}

function integer(value) {
  const parsed = parseInt(value.replace(/^\D*/, ''), 10);
  return isNaN(parsed) ? 0 : parsed;
}

function float(value) {
  const parsed = parseFloat(value.replace(/^\D*/, ''));
  return isNaN(parsed) ? 0 : parsed;
}


const ADV_GDN_VALUE_MAP = {
  conversions: integer,
  link_clicks: integer,
  impressions: integer,
  cpc: float,
  total_spent: float,
}

module.exports = {
  ADVERONIX_KEYMAP,
  ADVERONIX_MIRROR: mirror(ADVERONIX_KEYMAP),
  ADV_GDN_KEYMAP,
  ADV_GDN_VALUE_MAP,
}
