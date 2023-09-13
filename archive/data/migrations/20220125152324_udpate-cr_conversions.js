
exports.up = function(knex) {
  return knex.schema.table('cr_conversions', (tbl) => {
    tbl.string('keyword');
    tbl.float('est_revenue');
    tbl.boolean('posted_to_voluum');
  });
};

exports.down = function(knex) {
  return knex.schema.table('cr_conversions', (tbl) => {
    tbl.dropColumn('keyword');
    tbl.dropColumn('est_revenue');
    tbl.dropColumn('posted_to_voluum');
  });
};
