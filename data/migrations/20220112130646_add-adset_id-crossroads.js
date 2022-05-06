exports.up = function(knex) {
  return knex.schema.table('crossroads', (tbl) => {
    tbl.string('adset_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('crossroads', (tbl) => {
    tbl.dropColumn('adset_id');
  });
};
