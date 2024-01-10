/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return Promise.all([
    // Drop account_id from ad_accounts
    knex.schema.table('ad_accounts', table => {
      table.dropForeign(['account_id'], 'ad_accounts_account_id_foreign');
      table.dropColumn('account_id');
    }),

    // Drop account_id from crossroads_campaigns
    knex.schema.table('crossroads_campaigns', table => {
      table.dropForeign(['account_id'], 'crossroads_campaigns_account_id_foreign');
      table.dropColumn('account_id');
    }),

    // Drop account_id from tonic_campaigns
    knex.schema.table('tonic_campaigns', table => {
      table.dropForeign(['account_id'], 'crossroads_campaigns_account_id_foreign');
      table.dropColumn('account_id');
    }),

    // Drop account_id from facebook_ads
    knex.schema.table('facebook_ads', table => {
      table.dropForeign(['account_id'], 'facebook_ads_account_id_foreign');
      table.dropColumn('account_id');
    }),

    // Drop account_id from adsets
    knex.schema.table('adsets', table => {
      table.dropForeign(['account_id'], 'foreign_user_account_id');
      table.dropColumn('account_id');
    }),

    // Drop account_id from fb_pixels
    knex.schema.table('fb_pixels', table => {
      table.dropForeign(['account_id'], 'foreign_user_account_id');
      table.dropColumn('account_id');
    }),

    // Drop account_id from pages
    knex.schema.table('pages', table => {
      table.dropForeign(['account_id'], 'foreign_user_account_id');
      table.dropColumn('account_id');
    }),

    // Drop account_id from campaigns
    knex.schema.table('campaigns', table => {
      table.dropForeign(['account_id'], 'foreign_user_account_id');
      table.dropColumn('account_id');
    }),

    // Drop account_id from tt_pixels
    knex.schema.table('tt_pixels', table => {
      table.dropForeign(['account_id'], 'foreign_user_account_id');
      table.dropColumn('account_id');
    }),

    // Drop account_id from tiktok_ads
    knex.schema.table('tiktok_ads', table => {
      table.dropForeign(['account_id'], 'tiktok_ads_account_id_foreign');
      table.dropColumn('account_id');
    })

  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return Promise.all([
    // Add account_id back to ad_accounts and re-establish foreign key
    knex.schema.table('ad_accounts', table => {
      table.integer('account_id').unsigned();
      table.foreign('account_id', 'ad_accounts_account_id_foreign').references('id').inTable('user_accounts').onDelete('CASCADE');
    }),

    // Repeat for each table
    knex.schema.table('crossroads_campaigns', table => {
      table.integer('account_id').unsigned();
      table.foreign('account_id', 'crossroads_campaigns_account_id_foreign').references('id').inTable('user_accounts').onDelete('CASCADE');
    }),

    knex.schema.table('tonic_campaigns', table => {
      table.integer('account_id').unsigned();
      table.foreign('account_id', 'crossroads_campaigns_account_id_foreign').references('id').inTable('user_accounts').onDelete('CASCADE');
    }),

    knex.schema.table('facebook_ads', table => {
      table.integer('account_id').unsigned();
      table.foreign('account_id', 'facebook_ads_account_id_foreign').references('id').inTable('user_accounts').onDelete('CASCADE');
    }),

    knex.schema.table('adsets', table => {
      table.integer('account_id').unsigned();
      table.foreign('account_id', 'foreign_user_account_id').references('id').inTable('user_accounts').onDelete('CASCADE');
    }),

    knex.schema.table('fb_pixels', table => {
      table.integer('account_id').unsigned();
      table.foreign('account_id', 'foreign_user_account_id').references('id').inTable('user_accounts').onDelete('CASCADE');
    }),

    knex.schema.table('pages', table => {
      table.integer('account_id').unsigned();
      table.foreign('account_id', 'foreign_user_account_id').references('id').inTable('user_accounts').onDelete('CASCADE');
    }),

    knex.schema.table('campaigns', table => {
      table.integer('account_id').unsigned();
      table.foreign('account_id', 'foreign_user_account_id').references('id').inTable('user_accounts').onDelete('CASCADE');
    }),

    knex.schema.table('tt_pixels', table => {
      table.integer('account_id').unsigned();
      table.foreign('account_id', 'foreign_user_account_id').references('id').inTable('user_accounts').onDelete('CASCADE');
    }),

    knex.schema.table('tiktok_ads', table => {
      table.integer('account_id').unsigned();
      table.foreign('account_id', 'tiktok_ads_account_id_foreign').references('id').inTable('user_accounts').onDelete('CASCADE');
    })
  ]);
};
