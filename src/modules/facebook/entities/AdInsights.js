class AdInsight {

  constructor(
    ad_account_id,
    ad_id,
    adset_id,
    campaign_id,
    campaign_name,
    date,
    hour,
    impressions,
    link_clicks,
    total_spent,
    cpc,
    reporting_currency,
    conversions,
    clicks,
    events,
    lead,
    unique_identifier
  ) {
    this.ad_account_id = ad_account_id;
    this.ad_id = ad_id;
    this.adset_id = adset_id;
    this.campaign_id = campaign_id;
    this.campaign_name = campaign_name;
    this.date = date;
    this.hour = hour;
    this.impressions = impressions;
    this.link_clicks = link_clicks;
    this.total_spent = total_spent;
    this.cpc = cpc;
    this.reporting_currency = reporting_currency;
    this.conversions = conversions;
    this.clicks = clicks;
    this.events = events;
    this.lead = lead;
    this.unique_identifier = unique_identifier;
  }

}

module.exports = AdInsight;
