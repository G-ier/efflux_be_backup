exports.up = function(knex) {
  return knex.schema.table('facebook', (tbl) => {
    tbl.string('adset_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('facebook', (tbl) => {
    tbl.dropColumn('adset_id');
  });
};
