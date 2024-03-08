/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('fb_pixels', function (table) {
    table.bigInteger('ad_account_id').alter();
  })
  .then(() => {
    return knex.schema.table('fb_pixels', function (table) {
      table.foreign('ad_account_id').references('id').inTable('ad_accounts').onDelete('CASCADE');
    })
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('fb_pixels', function (table) {
    table.dropForeign('ad_account_id');
    table.string('ad_account_id').alter();
  })
};
