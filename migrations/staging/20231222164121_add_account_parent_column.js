exports.up = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.integer('account_parent').nullable().defaultTo(null).after('id');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.dropColumn('account_parent');
  });
};
