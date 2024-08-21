exports.up = function(knex) {
  return knex.schema.createTable('revenue', function(table) {
    table.increments('id').primary();
    table.string('traffic_source');
    table.string('account');
    table.timestamp('occurred_at', { useTz: false }).notNullable();
    table.string('campaign_id');
    table.timestamp('received_at', { useTz: false });
    table.string('network');
    table.string('ad_id');
    table.string('pixel_id');
    table.string('campaign_name');
    table.string('network_campaign_id').nullable();
    table.string('network_campaign_name');
    table.string('adset_id');
    table.string('adset_name').defaultTo('');
    table.integer('landings').defaultTo(0);
    table.integer('keyword_clicks').defaultTo(0);
    table.integer('conversions').defaultTo(0);
    table.decimal('revenue', 14, 2).defaultTo(0); // Adjusted for decimal representation
    table.string('final');
    table.timestamps(true, true); // Adds created_at and updated_at columns
    table.unique(['account', 'network_campaign_id', 'campaign_id', 'adset_id', 'ad_id', "occurred_at"], 'unique_revenue_record');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('revenue');
};
