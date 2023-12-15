exports.up = function(knex) {
  return knex.schema.createTable('pb_analysis_data', function(table) {
    table.text('date');
    table.integer('hour');
    table.text('ip').notNullable();
    table.text('session_id').notNullable();
    table.text('campaign_id').notNullable().defaultTo('Unknown');
    table.integer('api_visitors').defaultTo(0);
    table.integer('api_t_visitors').defaultTo(0);
    table.integer('api_landers').defaultTo(0);
    table.integer('pb_landers').defaultTo(0);
    table.integer('api_searches').defaultTo(0);
    table.integer('pb_searches').defaultTo(0);
    table.integer('api_purchase').defaultTo(0);
    table.integer('pb_purchase').defaultTo(0);
    table.float('api_revenue');
    table.float('pb_revenue');
    table.text('unique_identifier').unique('session_unique_identifier');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('pb_analysis_data');
};
