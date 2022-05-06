
exports.up = function(knex) {
  return knex.schema.table('crossroads', (tbl) => {
    tbl.string('pixel_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('crossroads', (tbl) => {
    tbl.dropColumn('pixel_id');
  });
};
