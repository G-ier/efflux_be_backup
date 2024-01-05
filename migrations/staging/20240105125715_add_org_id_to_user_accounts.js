/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema.table('user_accounts', function (table) {
    table.integer('org_id').unsigned();
    table.foreign('org_id').references('id').inTable('public.organizations');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema.table('user_accounts', function (table) {
    table.dropForeign('org_id');
    table.dropColumn('org_id');
  });
};
