/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('pixels', function(table) {
    table.string('id').primary(); // Pixel ID
    table.string('code') // Pixel code
    table.string('name') // Pixel name
    table.timestamp('creation_time').defaultTo(knex.fn.now()); // Creation time
    table.string('traffic_source').notNullable(); // Traffic source
    table.timestamp('last_fired_time'); // Last fired time
    table.string('activity_status'); // Status
    table.string('business_name'); // Business name
    table.string('business_id'); // Business ID
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('pixels');
};
