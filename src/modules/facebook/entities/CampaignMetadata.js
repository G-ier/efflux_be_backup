class CampaignMetadata {
  constructor(
    id, // assuming it's auto-incremented by the database
    name,
    objective,
    special_ad_category,
    special_ad_category_country,
    campaign_id, // foreign key reference to 'campaign_table'
    created_at, // auto-generated by knex
    updated_at  // auto-generated by knex
  ) {
    this.id = id;
    this.name = name;
    this.objective = objective;
    this.special_ad_category = special_ad_category;
    this.special_ad_category_country = special_ad_category_country;
    this.campaign_id = campaign_id;
    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}

module.exports = CampaignMetadata;
