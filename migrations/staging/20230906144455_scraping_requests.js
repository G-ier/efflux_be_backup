exports.up = function(knex) {
  return knex.schema.createTable('scraping_requests', function(table) {
    table.increments('id').primary();
    table.timestamp('created_time').defaultTo(knex.fn.now());
    table.text('user_provider_id');
    table.text('google_sheet_id');
    table.text('status');
    table.text('name');
    table.json('request');
    table.text('description');
    table.integer('ads_found').defaultTo(0);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('scraping_requests');
};
