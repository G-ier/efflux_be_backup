
exports.up = function(knex) {
  return knex.schema.table('cr_conversions', (tbl) => {
    tbl.string('cid');
  });
};

exports.down = function(knex) {
  return knex.schema.table('cr_conversions', (tbl) => {
    tbl.dropColumn('cid');
  });
};
