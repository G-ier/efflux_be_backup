exports.up = function(knex) {
  return knex.schema.createTable('postback_events', function(table) {
    table.increments('id').primary();
    table.text('date');
    table.smallint('hour');
    table.text('event_timestamp');
    table.text('event_type');
    table.text('pixel_id');
    table.text('campaign_id');
    table.text('adset_id');
    table.text('ad_id');
    table.smallint('step');
    table.text('searchterm');
    table.text('referrer_url');
    table.float('pb_value').defaultTo(0);
    table.text('city');
    table.text('country');
    table.text('state');
    table.text('zipcode');
    table.text('traffic_source');
    table.boolean('running_direct').defaultTo(false);
    table.text('fbclid');
    table.boolean('posted_to_fb').defaultTo(false);
    table.text('os');
    table.text('ip');
    table.text('device');
    table.text('browser');
    table.text('test_event_code');
    table.text('network').defaultTo('unknown');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.text('kwp');
    table.text('campaign_name');
    table.text('event_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('postback_events');
};
