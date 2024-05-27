exports.up = function(knex) {
  return knex.schema
    .dropTableIfExists('sedo_raw_events')
    .createTable('sedo_raw_events', function(table) {
      table.increments('id').primary();
      table.string('transaction_id').notNullable();
      table.timestamp('click_timestamp').notNullable();
      table.string('received_at');
      table.string('campaign_id');
      table.text('campaign_name');
      table.string('pixel_id');
      table.string('adset_id');
      table.text('adset_name');
      table.string('traffic_source');
      table.string('network').defaultTo('sedo');
      table.string('parsing_template');
      table.string('domain');
      table.string('keyword_clicked');
      table.float('revenue').defaultTo(0);
    });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('sedo_raw_events');
};
