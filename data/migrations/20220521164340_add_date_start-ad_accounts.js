exports.up = function(knex) {
  return knex.schema.table('ad_accounts', (tbl) => {
    tbl.string('date_start');
  });
};

exports.down = function(knex) {
  return knex.schema.table('ad_accounts', (tbl) => {
    tbl.dropColumn('date_start');
  });
};
