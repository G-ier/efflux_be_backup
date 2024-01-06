exports.up = function(knex) {
  return knex.schema.createTable('tonic_accounts', function(table) {
      table.increments("id").primary();
      table.string('email').notNullable();
      table.string('ckey').notNullable();
      table.string('csecret').notNullable();
  })
};

exports.down = function(knex) {
  return knex.schema.dropTable('tonic_accounts');
};
