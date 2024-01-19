/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('fb_pixels', function (table) {
    table.string('ad_account_provider_id').nullable();
  })
  .then(() => {
    return knex.raw(`
      UPDATE fb_pixels
      SET ad_account_provider_id = ad_account_id
    `)
  })
  .then(() => {
    return knex.schema.table('fb_pixels', function (table) {
      table.bigInteger('ad_account_id').alter()
    }
  )})
  .then(() => {
    return knex.raw(`
      DELETE FROM fb_pixels WHERE ad_account_provider_id NOT IN (SELECT provider_id FROM ad_accounts)
    `)
  })
  .then(() => {
    return knex.raw(`
      UPDATE fb_pixels
      SET ad_account_id = ad_accounts.id
      FROM ad_accounts
      WHERE fb_pixels.ad_account_provider_id = ad_accounts.provider_id
    `)
  })
  .then(() => {
    return knex.schema.table('fb_pixels', function (table) {
      table.foreign('ad_account_id').references('id').inTable('ad_accounts').onDelete('CASCADE');
    })
  })
  .then(() => {
    return knex.schema.table('fb_pixels', function (table) {
      table.dropColumn('ad_account_provider_id');
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
