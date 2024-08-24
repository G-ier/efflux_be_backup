// migration file: <timestamp>_adcreatives.js

exports.up = function(knex) {
  return knex.schema.createTable('adcreatives', function(table) {
    table.string('id', 40).primary();
    table.bigInteger('adaccountid').notNullable();
    table.string('name', 255).notNullable();
    table.text('description');
    table.string('media_type', 255).notNullable().defaultTo('link');
    table.text('media_url').notNullable();
    table.string('call_to_action', 255);
    table.string('page_id', 255);
    table.string('campaign_id', 255);
    table.string('adset_id', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('adcreatives');
};
