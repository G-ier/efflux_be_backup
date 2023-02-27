module.exports = class MetricsCalculator {
  constructor({
                total_spent,
                searches,
                lander_visits,
                revenue_clicks,
                tracked_visitors,
                revenue,
                pb_conversions,
                cr_conversions,
                s1_conversions,
                pb_search,
                pb_impressions,
                ts_conversions,
                fb_impressions,
                link_clicks,
                pb_unique_conversions,
                cr_unique_conversions,
                conversions,
                visitors,
                campaign_id,
                campaign_name,
                traffic_source,
                cr_camp_name,
                adset_id,
                adset_name,
              }) {
    this.total_spent = total_spent
    this.searches = searches
    this.lander_visits = lander_visits
    this.revenue_clicks = revenue_clicks
    this.tracked_visitors = tracked_visitors
    this.revenue = revenue
    this.conversions = conversions
    this.pb_conversions = pb_conversions
    this.cr_conversions = cr_conversions
    this.s1_conversions = s1_conversions
    this.pb_search = pb_search
    this.pb_impressions = pb_impressions
    this.ts_conversions = ts_conversions
    this.fb_impressions = fb_impressions
    this.link_clicks = link_clicks
    this.pb_unique_conversions = pb_unique_conversions
    this.cr_unique_conversions = cr_unique_conversions
    this.visitors = visitors
    this.campaign_id = campaign_id
    this.campaign_name = campaign_name
    this.traffic_source = traffic_source
    this.cr_camp_name = cr_camp_name
    this.adset_id = adset_id
    this.adset_name = adset_name
    this.network_conversions = this.s1_conversions || this.cr_conversions || this.pb_conversions || this.conversions || 0
    this.network_unique_conversions = this.cr_unique_conversions || 0
  }

  get rpc() {
    if (!this.network_conversions) return 0
    return this.revenue / this.network_conversions
  }

  get cr_rpc() {
    if (!this.revenue_clicks) return 0
    return this.revenue / this.revenue_clicks
  }

  get live_cpa() {
    if (!this.pb_conversions) return 0
    return this.total_spent / this.pb_conversions
  }

  get est_revenue() {
    return this.pb_conversions * this.rpc
  }

  get roi() {
    if (!this.total_spent) return 0
    return (this.revenue - this.total_spent) / this.total_spent * 100
  }

  get est_roi() {
    if (!this.total_spent) return 0
    return (this.est_revenue - this.total_spent) / this.total_spent * 100
  }

  get profit() {
    return this.revenue - this.total_spent
  }

  get est_profit() {
    return this.est_revenue - this.total_spent
  }

  get facebook_ctr() {
    if (!this.fb_impressions) return 0
    return this.link_clicks / this.fb_impressions * 100
  }

  get cpa() {
    if (!this.network_conversions) return 0
    return this.total_spent / this.network_conversions
  }

  get rpi() {
    if (!this.fb_impressions) return 0
    return this.revenue / this.fb_impressions
  }

  get cpc() {
    if (!this.link_clicks) return 0
    return this.total_spent / this.link_clicks
  }

  get live_ctr() {
    if (!this.link_clicks) return 0
    return this.pb_conversions / this.link_clicks * 100
  }

  get cpm() {
    if (!this.fb_impressions) return 0
    return this.total_spent / this.fb_impressions * 1000
  }

  get rpm() {
    if (!this.fb_impressions) return 0
    return this.revenue / this.fb_impressions * 1000
  }

  get cr_rpm() {
    if (!this.tracked_visitors) return 0
    return this.revenue / this.tracked_visitors * 1000
  }

  get unique_cpa() {
    if (!this.network_unique_conversions) return 0
    return this.total_spent / this.network_unique_conversions
  }


  get unique_rpc() {
    if (!this.network_unique_conversions) return 0
    return this.revenue / this.network_unique_conversions
  }

  round(num) {
    return typeof num === 'number' ? num.toFixed(2) : num
  }
}

function testCalculator() {
  const t = new MetricsCalculator({
    total_spent: 33.07,
    revenue: 42.56,
    pb_conversions: 45,
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
