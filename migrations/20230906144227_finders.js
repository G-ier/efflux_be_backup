exports.up = function(knex) {
  return knex.schema.createTable('finders', function(table) {
    table.increments('id').primary();
    table.json('accounts');
    table.text('profilename');
    table.enu('status', ['inuse', 'free', 'failed']);
    table.integer('proxy_id').references('id').inTable('proxies').onDelete('SET NULL');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('finders');
};
