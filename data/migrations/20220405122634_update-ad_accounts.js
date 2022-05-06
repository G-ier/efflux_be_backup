exports.up = function(knex) {
  return knex.schema.table('ad_accounts', (tbl) => {
    tbl.string('amount_spent');
    tbl.string('balance');
    tbl.string('spend_cap');
    tbl.string('currency');
    tbl.string('tz_name');
    tbl.smallint('tz_offset');
  });
};

exports.down = function(knex) {
  return knex.schema.table('ad_accounts', (tbl) => {
    tbl.dropColumn('tz_offset');
    tbl.dropColumn('tz_name');
    tbl.dropColumn('currency');
    tbl.dropColumn('spend_cap');
    tbl.dropColumn('balance');
    tbl.dropColumn('amount_spent');
  });
};
