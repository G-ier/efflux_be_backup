exports.up = function(knex) {
  return knex.schema.createTable('ads', function(table) {
    table.increments('id').primary();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.string('ad_archive_id', 255);
    table.text('primary_text');
    table.string('publisher_identifier', 255);
    table.string('publisher_type', 255);
    table.string('publisher_name', 255);
    table.string('starting_date', 30);
    table.string('status', 255);
    table.jsonb('ad_cards');
    table.specificType('keywords', 'text[]');
    table.text('link');
    table.text('landing_url');
    table.string('network', 255);
    table.text('cta');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('ads');
};
