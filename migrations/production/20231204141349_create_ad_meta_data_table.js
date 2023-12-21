// migration for ad_metadata table

exports.up = function(knex) {
  return knex.schema.createTable('ad_metadata', table => {
    table.increments('id').primary();
    table.string('name').defaultTo('');
    table.string('status').defaultTo('PAUSED');
    table.string('creative_name').defaultTo('');
    table.string('page_id').defaultTo('')
    table.json('asset_feed_spec').defaultTo('{}');

    table.string('ad_id').defaultTo('');
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('ad_metadata');
};
