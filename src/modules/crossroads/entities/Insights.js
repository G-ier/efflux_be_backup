class Insights {
  constructor(
    id,
    date,
    campaign_id,
    ad_id,
    total_revenue,
    total_searches,
    total_lander_visits,
    total_revenue_clicks,
    total_visitors,
    total_tracked_visitors,
    hour_fetched,
    created_at = new Date(),
    updated_at = new Date(),
    hour,
    pixel_id,
    account,
    adset_id,
    crossroads_campaign_id,
    request_date,
    campaign_name,
    adset_name,
    traffic_source,
    cr_camp_name
  ) {
    this.id = id;
    this.date = date;
    this.campaign_id = campaign_id;
    this.ad_id = ad_id;
    this.total_revenue = total_revenue;
    this.total_searches = total_searches;
    this.total_lander_visits = total_lander_visits;
    this.total_revenue_clicks = total_revenue_clicks;
    this.total_visitors = total_visitors;
    this.total_tracked_visitors = total_tracked_visitors;
    this.hour_fetched = hour_fetched;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.hour = hour;
    this.pixel_id = pixel_id;
    this.account = account;
    this.adset_id = adset_id;
    this.crossroads_campaign_id = crossroads_campaign_id;
    this.request_date = request_date;
    this.campaign_name = campaign_name;
    this.adset_name = adset_name;
    this.traffic_source = traffic_source;
    this.cr_camp_name = cr_camp_name;
  }
}

module.exports = Insights;
