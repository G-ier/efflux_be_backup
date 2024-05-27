/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('verticals', function(table) {
      table.increments('id').primary();  // Auto-incrementing primary key
      table.string('name', 255).notNullable();  // Name of the vertical
      table.integer('provider_id').notNullable();  // Foreign key to provider
      table.string('provider', 255).notNullable();  // Name or descriptor of the provider

      // Unique constraint on the combination of provider_id and provider
      table.unique(['provider_id', 'provider']);
  });
};

/**
* @param { import("knex").Knex } knex
* @returns { Promise<void> }
*/
exports.down = function(knex) {
  return knex.schema.dropTable('verticals');
};
