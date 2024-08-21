/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return Promise.all([
    // Drop user_id from ad_accounts
    knex.schema.table('ad_accounts', table => {
      table.dropForeign(['user_id'], 'ad_accounts_user_id_foreign');
      table.dropColumn('user_id');
    }),

    // Drop user_id from adsets
    knex.schema.table('adsets', table => {
      table.dropForeign(['user_id'], 'adsets_user_id_foreign');
      table.dropColumn('user_id');
    }),

    // Drop user_id from pages
    knex.schema.table('pages', table => {
      table.dropForeign(['user_id'], 'campaigns_user_id_foreign');
      table.dropColumn('user_id');
    }),

    // Drop user_id from campaigns
    knex.schema.table('campaigns', table => {
      table.dropForeign(['user_id'], 'campaigns_user_id_foreign');
      table.dropColumn('user_id');
    }),

    // Drop user_id from tonic_campaigns
    knex.schema.table('tonic_campaigns', table => {
      table.dropForeign(['user_id'], 'crossroads_campaigns_user_id_foreign');
      table.dropColumn('user_id');
    }),

    // Drop user_id from crossroads_campaigns
    knex.schema.table('crossroads_campaigns', table => {
      table.dropForeign(['user_id'], 'crossroads_campaigns_user_id_foreign');
      table.dropColumn('user_id');
    }),

    // Drop user_id from facebook_ads
    knex.schema.table('facebook_ads', table => {
      table.dropForeign(['user_id'], 'facebook_ads_user_id_foreign');
      table.dropColumn('user_id');
    }),

    // Drop user_id from fb_pixels
    knex.schema.table('fb_pixels', table => {
      table.dropForeign(['user_id'], 'fb_pixels_user_id_foreign');
      table.dropColumn('user_id');
    }),

    // Drop user_id from tt_pixels
    knex.schema.table('tt_pixels', table => {
      table.dropForeign(['user_id'], 'fb_pixels_user_id_foreign'); // Check constraint name
      table.dropColumn('user_id');
    }),

    // Drop user_id from media_folders
    knex.schema.table('media_folders', table => {
      table.dropForeign(['user_id'], 'media_folders_user_id_foreign');
      table.dropColumn('user_id');
    }),

    // Drop admin_id from organizations
    knex.schema.table('organizations', table => {
      table.dropForeign(['admin_id'], 'organizations_admin_id_foreign');
      table.dropColumn('admin_id');
    }),

    // Drop user_id from tiktok_ads
    knex.schema.table('tiktok_ads', table => {
      table.dropForeign(['user_id'], 'tiktok_ads_user_id_foreign');
      table.dropColumn('user_id');
    }),

    knex.schema.table('insights', table => {
      table.dropColumn('user_id');
    }),

    knex.schema.table('taboola_ads', table => {
      table.dropColumn('user_id');
    })
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return Promise.all([
    // Add user_id back to ad_accounts and re-establish foreign key
    knex.schema.table('ad_accounts', table => {
      table.integer('user_id').unsigned();
      table.foreign('user_id', 'ad_accounts_user_id_foreign').references('id').inTable('users').onDelete('CASCADE');
    }),

    // Repeat for each table
    knex.schema.table('adsets', table => {
      table.integer('user_id').unsigned();
      table.foreign('user_id', 'adsets_user_id_foreign').references('id').inTable('users').onDelete('CASCADE');
    }),

    knex.schema.table('pages', table => {
      table.integer('user_id').unsigned();
      table.foreign('user_id', 'campaigns_user_id_foreign').references('id').inTable('users').onDelete('CASCADE');
    }),

    knex.schema.table('campaigns', table => {
      table.integer('user_id').unsigned();
      table.foreign('user_id', 'campaigns_user_id_foreign').references('id').inTable('users').onDelete('CASCADE');
    }),

    knex.schema.table('tonic_campaigns', table => {
      table.integer('user_id').unsigned();
      table.foreign('user_id', 'crossroads_campaigns_user_id_foreign').references('id').inTable('users').onDelete('CASCADE');
    }),

    knex.schema.table('crossroads_campaigns', table => {
      table.integer('user_id').unsigned();
      table.foreign('user_id', 'crossroads_campaigns_user_id_foreign').references('id').inTable('users').onDelete('CASCADE');
    }),

    knex.schema.table('facebook_ads', table => {
      table.integer('user_id').unsigned();
      table.foreign('user_id', 'facebook_ads_user_id_foreign').references('id').inTable('users').onDelete('CASCADE');
    }),

    knex.schema.table('fb_pixels', table => {
      table.integer('user_id').unsigned();
      table.foreign('user_id', 'fb_pixels_user_id_foreign').references('id').inTable('users').onDelete('CASCADE');
    }),

    knex.schema.table('tt_pixels', table => {
      table.integer('user_id').unsigned();
      table.foreign('user_id', 'fb_pixels_user_id_foreign').references('id').inTable('users').onDelete('CASCADE'); // Check constraint name
    }),

    knex.schema.table('media_folders', table => {
      table.integer('user_id').unsigned();
      table.foreign('user_id', 'media_folders_user_id_foreign').references('id').inTable('users').onDelete('CASCADE');
    }),

    knex.schema.table('organizations', table => {
      table.integer('admin_id').unsigned();
      table.foreign('admin_id', 'organizations_admin_id_foreign').references('id').inTable('users');
    }),

    knex.schema.table('tiktok_ads', table => {
      table.integer('user_id').unsigned();
      table.foreign('user_id', 'tiktok_ads_user_id_foreign').references('id').inTable('users').onDelete('CASCADE');
    }),

    knex.schema.table('insights', table => {
      table.integer('user_id').unsigned();
    }),

    knex.schema.table('taboola_ads', table => {
      table.integer('user_id').unsigned();
    })

  ]);
};
