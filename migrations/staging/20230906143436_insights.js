exports.up = function(knex) {
  return knex.schema.createTable('insights', function(table) {
    table.increments('id').primary();
    table.string('date', 11);
    table.smallint('hour');
    table.string('campaign_id', 30);
    table.text('campaign_name');
    table.string('adset_id', 30);
    table.text('adset_name');
    table.integer('user_id');
    table.integer('ad_account_id');
    table.decimal('revenue', 10, 2);
    table.decimal('spend', 10, 2);
    table.decimal('spend_plus_fee', 10, 2);
    table.integer('link_clicks');
    table.integer('fb_conversions');
    table.integer('cr_conversions');
    table.integer('cr_uniq_conversions');
    table.integer('pb_conversions');
    table.integer('searches');
    table.integer('lander_visits');
    table.integer('visitors');
    table.integer('tracked_visitors');
    table.integer('impressions');
    table.string('traffic_source', 30);
    table.text('unique_identifier').unique("unique_identifier");
    table.decimal('unallocated_revenue', 10, 2);
    table.decimal('unallocated_spend', 10, 2);
    table.decimal('unallocated_spend_plus_fee', 10, 2);
    table.integer('ts_clicks');
    table.timestamp('ts_updated_at');
    table.integer('pb_lander_conversions');
    table.integer('pb_serp_conversions');
    table.timestamp('network_updated_at');
    table.string('network', 30).defaultTo('crossroads');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('insights');
};
