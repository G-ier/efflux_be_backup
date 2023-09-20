exports.up = function(knex) {
  return knex.schema.table('ad_accounts', (tbl) => {
    tbl.float('today_spent').defaultTo(0);
  });
};

exports.down = function(knex) {
  return knex.schema.table('ad_accounts', (tbl) => {
    tbl.dropColumn('today_spent');
  });
};
