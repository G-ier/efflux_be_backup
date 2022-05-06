exports.up = function(knex) {
  return knex.schema.table('fb_conversions', (tbl) => {
    tbl.string('adset_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('fb_conversions', (tbl) => {
    tbl.dropColumn('adset_id');
  });
};
