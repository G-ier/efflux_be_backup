/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('network_campaigns_user_relations', table => {
    table.enu('source', ['manual', 'automatic']).notNullable().defaultTo('automatic');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('network_campaigns_user_relations', table => {
    table.dropColumn('source');
  });
};
