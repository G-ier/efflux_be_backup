exports.up = function(knex) {
  return knex.schema.table('cr_conversions', (tbl) => {
    tbl.string('account');
  });
};

exports.down = function(knex) {
  return knex.schema.table('cr_conversions', (tbl) => {
    tbl.dropColumn('account');
  });
};
