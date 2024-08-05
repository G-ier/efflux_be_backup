exports.up = function(knex) {
  return knex.schema.createTable('analytics', function(table) {
    table.increments('id').primary();
    table.string('traffic_source');
    table.string('network');
    table.timestamp('timeframe', { useTz: false }).notNullable();
    table.string('campaign_id');
    table.string('campaign_name');
    table.string('adset_id');
    table.string('adset_name');
    table.string('ad_id');
    table.string('timezone');
    table.string('ad_account_id');
    table.timestamp('ts_last_updated_at', { useTz: false })
    table.integer('ts_impressions').defaultTo(0);
    table.integer('ts_clicks').defaultTo(0);
    table.integer('ts_link_clicks').defaultTo(0);
    table.integer('ts_conversions').defaultTo(0);
    table.string('nw_account_id');
    table.string('nw_campaign_id');
    table.string('nw_campaign_name');
    table.timestamp('nw_last_updated_at', { useTz: false })
    table.integer('nw_tracked_visitors').defaultTo(0);
    table.integer('nw_kw_clicks').defaultTo(0);
    table.integer('nw_conversions').defaultTo(0);
    table.decimal('spend', 14, 2).defaultTo(0);
    table.decimal('spend_plus_fee', 14, 2).defaultTo(0);
    table.decimal('revenue', 14, 2).defaultTo(0);
    table.timestamps(true, true);
    table.unique(['network', 'traffic_source', 'timeframe', 'adset_id'], 'unique_analytic_record');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('analytics');
};
