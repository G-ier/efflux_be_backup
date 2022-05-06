exports.up = function(knex) {
  return knex.schema.table('facebook', (tbl) => {
    tbl.string('ad_account_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('facebook', (tbl) => {
    tbl.dropColumn('ad_account_id');
  });
};
