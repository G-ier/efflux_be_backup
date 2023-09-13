class AdInsight {
  constructor(
    id,
    date,
    campaign_name,
    campaign_id,
    ad_id,
    total_spent,
    clicks,
    cpc,
    reporting_currency,
    created_at,
    updated_at,
    hour,
    conversions,
    impressions,
    adset_id,
    ad_account_id,
    cpm,
    ctr,
    unique_identifier
  ) {
    this.id = id;
    this.date = date;
    this.campaign_name = campaign_name;
    this.campaign_id = campaign_id;
    this.ad_id = ad_id;
    this.total_spent = total_spent;
    this.clicks = clicks || 0; // default value is 0
    this.cpc = cpc;
    this.reporting_currency = reporting_currency;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.hour = hour;
    this.conversions = conversions || 0; // default value is 0
    this.impressions = impressions;
    this.adset_id = adset_id;
    this.ad_account_id = ad_account_id;
    this.cpm = cpm;
    this.ctr = ctr;
    this.traffic_source = "tiktok"; // static value for tiktok
    this.unique_identifier = unique_identifier;
  }
}

module.exports = AdInsight;
