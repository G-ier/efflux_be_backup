exports.up = function(knex) {
    return knex.schema.createTable('ad_queue', function(table) {
      table.increments('id').primary();
      table.string('status');
      table.string('ad_account_id');
      table.string('campaign_id');
      table.string('campaign_name');
      table.string('campaign_objective');
      table.json('campaign_special_ad_categories');
      table.string('campaign_special_ad_categorie_country');
      table.string('adset_name');
      table.json('adset_special_ad_categories');
      table.string('adset_special_ad_categorie_country');
      table.string('dsa_beneficiary');
      table.string('dsa_payor');
      table.string('adset_optimization_goal');
      table.decimal('adset_daily_budget');
      table.string('adset_billing_event');
      table.string('adset_status');
      table.boolean('is_dynamic_creative');
      table.json('promoted_object');
      table.json('adset_targeting'); 
      table.json('attribution_spec');
      table.text('content');
      table.string('ad_name');
      table.string('creative_name');
      table.string('ad_status');
      table.json('asset_feed_spec');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('ad_queue');
  };
  