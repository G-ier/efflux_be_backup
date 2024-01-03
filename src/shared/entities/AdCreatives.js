class AdCreative {
    constructor(
      id,
      name,
      description,
      media_type,
      media_url,
      call_to_action,
      campaign_id,
      adset_id,
      created_at,
      updated_at
    ) {
      this.id = id;
      this.name = name;
      this.description = description;
      this.media_type = media_type;
      this.media_url = media_url;
      this.call_to_action = call_to_action;
      this.campaign_id = campaign_id;
      this.adset_id = adset_id;
      this.created_at = created_at;
      this.updated_at = updated_at;
    }
  }
  
  module.exports = AdCreative;
  