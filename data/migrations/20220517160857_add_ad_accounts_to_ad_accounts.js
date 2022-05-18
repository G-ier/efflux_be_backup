exports.up = function(knex) {
  return knex.schema.table('ad_accounts', (tbl) => {
    tbl.string('fb_account_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('ad_accounts', (tbl) => {
    tbl.dropColumn('fb_account_id');
  });
};
