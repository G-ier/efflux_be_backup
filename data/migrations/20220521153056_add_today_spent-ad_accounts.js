exports.up = function(knex) {
  return knex.schema.table('ad_accounts', (tbl) => {
    tbl.string('today_spent');
  });
};

exports.down = function(knex) {
  return knex.schema.table('ad_accounts', (tbl) => {
    tbl.dropColumn('today_spent');
  });
};
