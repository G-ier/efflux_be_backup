/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('efflux_errors', table => {
    table.increments('id');
    table.text('source').notNullable();
    table.text('description').notNullable();
    table.date('date').notNullable();
    table.text('type').notNullable();
    table.unique(['source', 'date', 'type']);
    table.boolean('resolved').defaultTo(false);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('efflux_errors');
};
