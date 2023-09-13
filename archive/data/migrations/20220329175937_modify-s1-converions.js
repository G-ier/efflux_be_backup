exports.up = function(knex) {
  return knex.schema.table('s1_conversions', (tbl) => {
    tbl.string('rskey')
    tbl.string('fbclick')
  });
};

exports.down = function(knex) {
  return knex.schema.table('s1_conversions', (tbl) => {
    tbl.dropColumn('rskey')
    tbl.dropColumn('fbclick')
  });
};
