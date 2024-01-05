exports.up = function(knex) {
  return knex.schema.table('user_accounts', function(table) {
    table.boolean('fetching').defaultTo(true);
    table.boolean('backup').defaultTo(false);
    table.string('role').defaultTo('client');
  });
};

exports.down = function(knex) {
  return knex.schema.table('user_accounts', function(table) {
    table.dropColumn('fetching');
    table.dropColumn('backup');
    table.dropColumn('role');
  });
};
