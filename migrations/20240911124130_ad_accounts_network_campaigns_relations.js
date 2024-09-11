/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('ad_accounts_network_campaigns_map', table => {
    table.increments('id').primary();
    table.string('network_campaign_id').notNullable();
    table.string('network').notNullable();
    table.integer('ad_account_id').unsigned().notNullable();
    table.timestamps(true, true);
    table.foreign(['network_campaign_id', 'network']).references(['id', 'network']).inTable('network_campaigns');
    table.foreign('ad_account_id').references('id').inTable('ad_accounts');

    // Add unique constraint
    table.unique(['ad_account_id', 'network_campaign_id', 'network']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('ad_accounts_network_campaigns_map');
};
