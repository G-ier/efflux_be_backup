exports.up = function(knex) {
  return knex.schema.createTable('proxies', function(table) {
    table.increments('id').primary();
    table.text('proxy');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('proxies');
};
