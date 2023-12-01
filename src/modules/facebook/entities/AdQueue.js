class AdQueue {
  constructor(dbObject) {
    this.id = dbObject.id;
    this.status = dbObject.status;
    this.ad_account_id = dbObject.ad_account_id;
    this.created_at = dbObject.created_at;
    this.updated_at = dbObject.updated_at;

    // Separate campaign data
    this.campaign = {
      name: dbObject.campaign_name,
      objective: dbObject.campaign_objective,
      special_ad_categories: dbObject.campaign_special_ad_categories,
      special_ad_categorie_country: dbObject.campaign_special_ad_categorie_country
    };

    // Separate adset data
    this.adset = {
      name: dbObject.adset_name,
      special_ad_categories: dbObject.adset_special_ad_categories,
      special_ad_categorie_country: dbObject.adset_special_ad_categorie_country,
      dsa_beneficiary: dbObject.dsa_beneficiary,
      dsa_payor: dbObject.dsa_payor,
      optimization_goal: dbObject.adset_optimization_goal,
      daily_budget: dbObject.adset_daily_budget,
      billing_event: dbObject.adset_billing_event,
      status: dbObject.adset_status,
      is_dynamic_creative: dbObject.is_dynamic_creative,
      promoted_object: dbObject.promoted_object, // Ensure this is an object or parsed if a string
      targeting: dbObject.adset_targeting, // Ensure this is an object or parsed if a string
      attribution_spec: dbObject.attribution_spec // Ensure this is an array or parsed if a string
    };

    // Separate ad and creative data
    this.ad = {
      name: dbObject.ad_name,
      status: dbObject.ad_status,
      creative_name: dbObject.creative_name,
      asset_feed_spec: dbObject.asset_feed_spec // Ensure this is an object or parsed if a string
    };
  }

}

module.exports = AdQueue;
