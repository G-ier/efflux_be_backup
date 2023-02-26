exports.up = function(knex) {
  return knex.schema.table('fb_conversions', (tbl) => {
    tbl.string('kwp');
  });
};

exports.down = function(knex) {
  return knex.schema.table('fb_conversions', (tbl) => {
    tbl.dropColumn('kwp')
  });
};
