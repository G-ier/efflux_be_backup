class CampaignInsight {
  constructor({
    date,
    hour,
    campaign_name,
    campaign_id,
    clicks,
    impressions,
    visible_impressions,
    spent,
    conversions_value,
    roas,
    ctr,
    vctr,
    cpm,
    vcpm,
    cpc,
    campaigns_num,
    cpa,
    cpa_clicks,
    cpa_views,
    cpa_actions_num,
    cpa_actions_num_from_clicks,
    cpa_actions_num_from_views,
    cpa_conversion_rate,
    cpa_conversion_rate_clicks,
    cpa_conversion_rate_views,
    currency,
  }) {
    this.date = date;
    this.hour = hour;
    this.campaign_id = campaign_id;
    this.campaign_name = campaign_name;
    this.clicks = clicks;
    this.impressions = impressions;
    this.visible_impressions = visible_impressions;
    this.spent = spent;
    this.conversions_value = conversions_value;
    this.roas = roas;
    this.ctr = ctr;
    this.vctr = vctr;
    this.cpm = cpm;
    this.vcpm = vcpm;
    this.cpc = cpc;
    this.campaigns_num = campaigns_num;
    this.cpa = cpa;
    this.cpa_clicks = cpa_clicks;
    this.cpa_views = cpa_views;
    this.cpa_actions_num = cpa_actions_num;
    this.cpa_actions_num_from_clicks = cpa_actions_num_from_clicks;
    this.cpa_actions_num_from_views = cpa_actions_num_from_views;
    this.cpa_conversion_rate = cpa_conversion_rate;
    this.cpa_conversion_rate_clicks = cpa_conversion_rate_clicks;
    this.cpa_conversion_rate_views = cpa_conversion_rate_views;
    this.currency = currency;
    this.unique_identifier = `${campaign_id}-${date}-${hour}`;
  }
}
  
  module.exports = CampaignInsight;
  