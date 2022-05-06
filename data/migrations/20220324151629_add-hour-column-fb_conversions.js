exports.up = function(knex) {
  return knex.schema.table('fb_conversions', (tbl) => {
    tbl.tinyint("hour");
  });
};

exports.down = function(knex) {
  return knex.schema.table('fb_conversions', (tbl) => {
    tbl.dropColumn('hour')
  });
};
