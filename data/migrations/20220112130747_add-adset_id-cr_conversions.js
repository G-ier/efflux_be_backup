exports.up = function(knex) {
  return knex.schema.table('cr_conversions', (tbl) => {
    tbl.string('adset_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('cr_conversions', (tbl) => {
    tbl.dropColumn('adset_id');
  });
};
