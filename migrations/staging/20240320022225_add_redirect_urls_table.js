/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('redirect_urls', function(table) {
    table.increments('id').primary();
    table.string('source', 255);
    table.integer('campaign_id');
    table.string('redirect_url', 255);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('redirect_urls');
};
