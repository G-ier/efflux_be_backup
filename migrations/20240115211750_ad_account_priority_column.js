/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  // Create ua_aa_map table
  return knex.schema.createTable('aa_prioritized_ua_map', function (table) {
    table.increments('id').primary();
    table.integer('ua_id').unsigned().notNullable();
    table.integer('aa_id').unsigned().notNullable();
    table.foreign('aa_id').references('id').inTable('ad_accounts');
    table.foreign('ua_id').references('id').inTable('user_accounts');
    table.unique('aa_id');
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('aa_prioritized_ua_map');
};
