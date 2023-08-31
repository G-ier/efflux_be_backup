class Ad {
  constructor(
    id,
    name,
    created_time,
    start_time,
    created_at,
    updated_at,
    traffic_source,
    provider_id,
    status,
    user_id,
    account_id,
    ad_account_id,
    campaign_id,
    ad_group_id,
    network
  ) {
    this.id = id;
    this.name = name;
    this.created_time = created_time;
    this.start_time = start_time;
    this.created_at = created_at || new Date(); // Default to current date-time
    this.updated_at = updated_at || new Date(); // Default to current date-time
    this.traffic_source = traffic_source;
    this.provider_id = provider_id;
    this.status = status;
    this.user_id = user_id;
    this.account_id = account_id;
    this.ad_account_id = ad_account_id;
    this.campaign_id = campaign_id;
    this.ad_group_id = ad_group_id;
    this.network = network;
  }
}

module.exports = Ad;
