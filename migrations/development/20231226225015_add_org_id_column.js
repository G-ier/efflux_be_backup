/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.up = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.integer('org_id').unsigned().nullable().after('id');
    table.foreign('org_id').references('organizations.id');

    table.integer('role_id').unsigned().nullable();
    table.foreign('role_id').references('roles.id');
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable('users', function (table) {
    table.dropColumn('org_id');
    table.dropColumn('role_id');
  });
};
