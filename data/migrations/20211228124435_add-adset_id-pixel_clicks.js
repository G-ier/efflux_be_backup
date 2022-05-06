exports.up = function(knex) {
  return knex.schema.table('pixel_clicks', (tbl) => {
    tbl.string('adset_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('pixel_clicks', (tbl) => {
    tbl.dropColumn('adset_id');
  });
};
