// Path: migrations/staging/20231222164121_add_account_parent_column.js
exports.up = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.integer('org_id').nullable().defaultTo(null).after('id');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.dropColumn('org_id');
  });
};
