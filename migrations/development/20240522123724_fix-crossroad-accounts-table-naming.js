exports.up = function(knex) {
  return knex.schema.createTable('crossroads_accounts', function(table) {
      table.increments("id").primary();
      table.string('name').notNullable();
      table.string('key').notNullable();
  }).then(
    knex.schema.dropTable('crossroad_accounts')
  )
};

exports.down = function(knex) {
  return knex.schema.dropTable('crossroads_accounts').then(
    knex.schema.createTable('crossroad_accounts', function(table) {
      table.increments("id").primary();
      table.string('name').notNullable();
      table.string('key').notNullable();
    })
  )
};
