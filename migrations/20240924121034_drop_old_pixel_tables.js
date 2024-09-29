/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

  return knex.schema
    .dropTableIfExists('table1')
    .then(() => knex.schema.dropTableIfExists('fb_pixels'))
    .then(() => knex.schema.dropTableIfExists('tt_pixels'));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Code to recreate the tables if needed
};
