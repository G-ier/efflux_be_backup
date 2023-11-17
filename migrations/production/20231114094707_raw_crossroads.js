exports.up = function(knex) {
  return knex.schema.createTable('raw_crossroads_data', function(table) {
    table.increments('id').primary();
    table.text('campaign__name');
    table.text('campaign__type');
    table.integer('campaign_id');
    table.text('ad_id');
    table.text('browser');
    table.text('campaign_number');
    table.text('category');
    table.text('city');
    table.text('country_code');
    table.date('date');
    table.text('account')
    table.text('device_type');
    table.text('gclid');
    table.integer('hour');
    table.text('keyword');
    table.text('lander_keyword');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.text('platform');
    table.text('publisher');
    table.text('referrer');
    table.text('revenue_keyword');
    table.text('search_term');
    table.text('state');
    table.text('tg1');
    table.text('tg2');
    table.text('tg3');
    table.text('tg4');
    table.text('tg5');
    table.text('tg6');
    table.text('tg7');
    table.text('tg8');
    table.text('tg9');
    table.text('tg10');
    table.integer('lander_searches');
    table.integer('lander_visitors');
    table.float('publisher_revenue_amount');
    table.integer('revenue_clicks');
    table.integer('total_visitors');
    table.integer('tracked_visitors');
    table.text('unique_identifier').unique('raw_crossroads_unique_identifier');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('raw_crossroads_data');
};
