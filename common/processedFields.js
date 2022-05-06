function getCtr(conversions, visitors) {
  if (!visitors) return 0;
  return Math.round(conversions / visitors * 100)
}

function getRpv(revenue, visitors) {
  if (!visitors) return 0;
  return Number((revenue / visitors).toFixed(2));
}

function getRpc(revenue, conversions) {
  if (!conversions) return 0;
  return Number((revenue / conversions).toFixed(2));
}

function getRpm(revenue, visitors) {
  if (!visitors) return 0;
  return Math.round(revenue / visitors * 1000);
}

function processCrossroadItem (item) {
  item.cr_ctr = getCtr(item.cr_revenue_clicks, item.cr_visitors);
  item.cr_rpv = getRpv(item.cr_revenue, item.cr_visitors);
  item.cr_rpc = getRpc(item.cr_revenue, item.cr_revenue_clicks);
  item.cr_rpm = getRpm(item.cr_revenue, item.cr_visitors);
  return item;
}

function processCrossroads(rows) {
  rows.forEach((item) => {
    processCrossroadItem(item);
  })
}

function getDefaults(p) {
  const prefix = p ? p + '_' : '';
  return {
    [prefix + 'ctr']: 0,
    [prefix + 'rpv']: 0,
    [prefix + 'rpc']: 0,
    [prefix + 'rpm']: 0,
  }
}

module.exports = {
  processCrossroads,
  processCrossroadItem,
  getDefaults,
}

