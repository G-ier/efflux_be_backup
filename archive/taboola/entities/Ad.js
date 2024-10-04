class Ad {
    constructor(
      id,
      title,
      status,
      cta,
      campaign_id,
      user_id,
      account_id,
    ) {
      this.id = id;
      this.name = title;
      this.created_time = status;
      this.start_time = cta;
      this.created_at = created_at || new Date(); // Default to current date-time
      this.updated_at = updated_at || new Date(); // Default to current date-time
      this.traffic_source = traffic_source;
      this.user_id = user_id;
      this.account_id = account_id;
      this.campaign_id = campaign_id;
    }
  }
  
  module.exports = Ad;
  