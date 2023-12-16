exports.up = function(knex) {
  return knex.schema.createTable('capi_logs', table => {
    table.increments('id').primary();
    table.text('traffic_source');
    table.text('reported_date');
    table.smallint('reported_hour');
    table.text('event_unix_timestamp')
    table.text('isos_timestamp')
    table.text('tz')
    table.text('session_id');
    table.text('campaign_name');
    table.text('campaign_id');
    table.integer('conversions_reported');
    table.float('revenue_reported');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('capi_logs');
};
