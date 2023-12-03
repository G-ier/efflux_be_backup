exports.up = function(knex) {
  return knex.schema.alterTable('user_accounts', function(table) {
    table.unique('name');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('user_accounts', function(table) {
    table.dropUnique('name');
  });
};
