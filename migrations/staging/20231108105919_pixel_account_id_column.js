
exports.up = function(knex) {
    return knex.schema.table('fb_pixels', (table) => {
        table.string('ad_account_id'); // Add the account_id column
      }).then(function () {
        return knex.raw(`
          UPDATE fb_pixels
          SET ad_account_id = substring(pixel_id_ad_account_id from '_(.+)')
        `);
      });
};

exports.down = function(knex) {
    return knex.schema.table('fb_pixels', (table) => {
        table.dropColumn('ad_account_id');  // Delete the account_id column
      });
};
