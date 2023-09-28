class Adset {
  constructor(data) {
    this.campaign_id = data.campaign_id;
    this.adset_id = data.adset_id;
    this.campaign_name = data.campaign_name;
    this.status = data.status;
    this.daily_budget = data.daily_budget;
    this.adset_name = data.adset_name;
    this.spend = data.spend;
    this.spend_plus_fee = data.spend_plus_fee;
    this.revenue = data.revenue;
    this.yesterday_spend = data.yesterday_spend;
    this.last_3_days_spend = data.last_3_days_spend;
    this.cr_uniq_conversions = data.cr_uniq_conversions;
    this.searches = data.searches;
    this.cr_conversions = data.cr_conversions;
    this.visitors = data.visitors;
    this.tracked_visitors = data.tracked_visitors;
    this.link_clicks = data.link_clicks;
    this.impressions = data.impressions;
    this.pb_conversions = data.pb_conversions;
    this.uniq_conversions = data.uniq_conversions;
    this.cost_per_purchase = data.cost_per_purchase;
    this.cost_per_lead = data.cost_per_lead;
    this.cost_per_complete_payment = data.cost_per_complete_payment;
    this.traffic_source_cost_per_result = data.traffic_source_cost_per_result;
  }
}
module.exports = Adset;
