exports.up = function(knex) {
  return knex.schema.hasColumn('fb_pixels', 'ad_account_id').then(exists => {
    if (!exists) {
      return knex.schema.table('fb_pixels', (table) => {
        table.string('ad_account_id'); // Add the ad_account_id column only if it doesn't exist
      }).then(() => {
        return knex.raw(`
          UPDATE fb_pixels
          SET ad_account_id = substring(pixel_id_ad_account_id from '_(.+)')
        `);
      });
    }
  });
};

exports.down = function(knex) {
  return knex.schema.table('fb_pixels', (table) => {
    table.dropColumn('ad_account_id'); // Delete the ad_account_id column
  });
};
