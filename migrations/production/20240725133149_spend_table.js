exports.up = function(knex) {
  return knex.schema.createTable('spend', function(table) {
    table.increments('id').primary();
    table.string('campaign_id');
    table.string('adset_id');
    table.timestamp('received_at', { useTz: false }).notNullable();
    table.timestamp('occurred_at', { useTz: false }).notNullable();
    table.string('timezone').nullable();
    table.integer('timezone_offset').nullable();
    table.string('campaign_name');
    table.string('traffic_source');
    table.string('ad_id');
    table.string('pixel_id');
    table.string('ad_account_id');
    table.string('ad_account_name').nullable();
    table.string('adset_name');
    table.decimal('spend', 14, 2).defaultTo(0);
    table.decimal('spend_plus_fee', 14, 2).defaultTo(0);
    table.integer('impressions').defaultTo(0);
    table.integer('clicks').defaultTo(0);
    table.integer('link_clicks').defaultTo(0);
    table.integer('ts_conversions').defaultTo(0);
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('spend');
};
