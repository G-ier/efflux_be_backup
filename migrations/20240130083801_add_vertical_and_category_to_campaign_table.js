/**
 * @param {import("knex").Knex} knex
 * @returns {Promise<void>}
 */
exports.up = function(knex) {
    // Add vertical and category columns to the campaigns table
    return knex.schema.table('campaigns', function(table) {
      table.string('vertical');
      table.string('category');
    });
  };
  
  /**
   * @param {import("knex").Knex} knex
   * @returns {Promise<void>}
   */
  exports.down = function(knex) {
    // Remove vertical and category columns from the campaigns table
    return knex.schema.table('campaigns', function(table) {
      table.dropColumn('vertical');
      table.dropColumn('category');
    });
  };
  