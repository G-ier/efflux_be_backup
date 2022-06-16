module.exports = class MetricsCalculator1 {
  constructor({
    campaign_id,
    adset_id,
    date,
    campaign_name,
    network,
    status,
    ad_account_name,
    time_zone,
    amount_spent,
    last_updated,
    s1_pb_conversion,
    s1_pb_last_updated,
    s1_conversion,
    s1_conversion_y,
    s1_revenue,
    s1_revenue_y,
    s1_last_updated,
    cr_pb_conversion,
    cr_pb_last_updated,
    cr_conversion,
    cr_conversion_y,
    cr_revenue,
    cr_revenue_y,
    cr_last_updated,
    sd_revenue,
    sd_last_updated,
    sd_revenue_y,
    sd_conversion,
    sd_conversion_y,
    sd_pb_conversion,
    sd_pb_last_updated,
    sd_pb_revenue,
    ave_revenue,
    ave_conversion,
    ave_revenue_y,
    ave_conversion_y,
    ave_rpc,
    link_clicks,
    fb_impressions,
    fb_conversions,
    fb_lead,
    fb_conversion_amount
  }) {
    this.campaign_id = campaign_id
    this.adset_id = adset_id
    this.date = date
    this.link_clicks = link_clicks
    this.fb_impressions = fb_impressions    
    this.fb_conversions = fb_conversions || fb_lead
    this.fb_conversion_amount = fb_conversion_amount
    this.ave_rpc = ave_rpc || 0
    this.campaign_name = campaign_name
    this.network = network
    this.status = status
    this.ad_account_name = ad_account_name
    this.time_zone = time_zone >= 0 ? 'UTC +' + time_zone : time_zone < 0 ? 'UTC ' + time_zone : ''
    this.amount_spent = amount_spent
    this.last_updated = last_updated
    this.s1_pb_conversion = s1_pb_conversion
    this.s1_pb_last_updated = s1_pb_last_updated
    this.s1_conversion = s1_conversion
    this.s1_conversion_y = s1_conversion_y
    this.s1_revenue = s1_revenue
    this.s1_revenue_y = s1_revenue_y
    this.s1_last_updated = s1_last_updated
    this.cr_pb_conversion = cr_pb_conversion
    this.cr_pb_last_updated = cr_pb_last_updated
    this.cr_conversion = cr_conversion
    this.cr_conversion_y = cr_conversion_y
    this.cr_revenue = cr_revenue
    this.cr_revenue_y = cr_revenue_y
    this.cr_last_updated = cr_last_updated
    this.sd_pb_conversion = sd_pb_conversion
    this.sd_revenue = sd_revenue || sd_pb_revenue
    this.sd_last_updated = sd_last_updated
    this.sd_revenue_y = sd_revenue_y
    this.sd_conversion = sd_conversion || sd_pb_conversion
    this.sd_conversion_y = sd_conversion_y
    this.sd_pb_revenue = sd_pb_revenue
    this.sd_pb_last_updated = sd_pb_last_updated
    this.ave_revenue = ave_revenue // ave_rpc
    this.ave_conversion = ave_conversion // ave_rpc
    this.ave_revenue_y = ave_revenue_y // ave_rpc
    this.ave_conversion_y = ave_conversion_y // ave_rpc    
    this.nt_conversion = this.s1_conversion || this.sd_conversion || this.cr_conversion || 0
    this.nt_conversion_y = this.s1_conversion_y || this.sd_conversion_y || this.cr_conversion_y || 0
    this.revenue = this.s1_revenue || this.sd_revenue || this.cr_revenue || 0
    this.revenue_y = this.s1_revenue_y || this.sd_revenue_y || this.cr_revenue_y || 0
    this.nt_last_updated = this.s1_last_updated || this.cr_last_updated || this.sd_last_updated || 0
    this.pb_last_updated = this.s1_pb_last_updated || this.cr_pb_last_updated || this.sd_pb_last_updated || 0
    this.pb_conversion = this.s1_pb_conversion || this.cr_pb_conversion || this.sd_pb_conversion || 0     
    this.pb_payout = this.s1_pb_revenue || this.sd_pb_revenue || this.cr_pb_revenue || 0
  }

  get rpc() {
    if (this.nt_conversion) return this.revenue / this.nt_conversion  // today
    else if (this.nt_conversion_y) return this.revenue_y / this.nt_conversion_y  // yesterday
    return 0
  }

  // get ave_rpc() {
  //   if (this.ave_conversion) return this.ave_revenue / this.ave_conversion  // today
  //   else if (this.ave_conversion_y) return this.ave_revenue_y / this.ave_conversion_y  // yesterday
  //   return 0
  // }

  get live_cpa() {
    if (!this.pb_conversion) return 0
    return this.amount_spent / this.pb_conversion
  }

  get est_revenue() {
    return (this.pb_conversion - this.nt_conversion) * this.ave_rpc + this.revenue
  }

  get roi() {
    if (!this.amount_spent) return 0
    return (this.revenue - this.amount_spent) / this.amount_spent * 100
  }

  get est_roi() {
    if (!this.amount_spent) return 0
    return (this.est_revenue - this.amount_spent) / this.amount_spent * 100
  }

  get profit() {
    return this.revenue - this.amount_spent
  }

  get est_profit() {
    return this.pb_conversion * this.rpc - this.amount_spent
  }

  // get facebook_ctr() {
  //   if (!this.fb_impressions) return 0
  //   return this.link_clicks / this.fb_impressions * 100
  // }

  // get cpa() {
  //   if (!this.network_conversions) return 0
  //   return this.amount_spent / this.network_conversions
  // }

  // get rpi() {
  //   if (!this.fb_impressions) return 0
  //   return this.revenue / this.fb_impressions
  // }

  // get cpc() {
  //   if (!this.link_clicks) return 0
  //   return this.amount_spent / this.link_clicks
  // }

  // get live_ctr() {
  //   if (!this.link_clicks) return 0
  //   return this.pb_conversion / this.link_clicks * 100
  // }

  // get cpm() {
  //   if (!this.fb_impressions) return 0
  //   return this.amount_spent / this.fb_impressions * 1000
  // }

  // get rpm() {
  //   if (!this.fb_impressions) return 0
  //   return this.revenue / this.fb_impressions * 1000
  // }

  // get unique_cpa() {
  //   if (!this.network_unique_conversions) return 0
  //   return this.amount_spent / this.network_unique_conversions
  // }


  // get unique_rpc() {
  //   if (!this.network_unique_conversions) return 0
  //   return this.revenue / this.network_unique_conversions
  // }

  round(num) {
    return typeof num === 'number' ? num.toFixed(2) : num
  }
}

function testCalculator() {
  const t = new MetricsCalculator1({
    amount_spent: 33.07,
    revenue: 42.56,
    pb_conversion: 45,
    network_conversions: 38,
    search: 67,
    impressions: 129,
    ts_conversions: 8,
    fb_impressions: 4505,
    link_clicks: 174,
  })

  assert('rpc', t.round(t.rpc), '1.12')
  assert('live_cpa', t.round(t.live_cpa), '0.73')
  assert('est_revenue', t.round(t.est_revenue), '50.40')
  assert('roi', t.round(t.roi), '28.70')
  assert('est_roi', t.round(t.est_roi), '52.40')
  assert('profit', t.round(t.profit), '9.49')
  assert('est_profit', t.round(t.est_profit), '17.33')
  assert('facebook_ctr', t.round(t.facebook_ctr), '3.86')
  assert('cpa', t.round(t.cpa), '0.87')
  assert('rpi', t.round(t.rpi), '0.01')
  assert('cpc', t.round(t.cpc), '0.19')
  assert('live_ctr', t.round(t.live_ctr), '25.86')
  assert('cpm', t.round(t.cpm), '7.34')
  assert('rpm', t.round(t.rpm), '9.45')


  function assert(type, val, expectedVal) {
    if (val === expectedVal) console.log(`${type} is good`)
    else console.error(`${type}: ${val} should equal to ${expectedVal}`)
  }
}
