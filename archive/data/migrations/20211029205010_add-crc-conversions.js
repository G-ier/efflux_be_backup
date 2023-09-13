
exports.up = function(knex) {
  return knex.schema.table('cr_conversions', (tbl) => {
    tbl.integer('conversions').defaultTo(0);
  });
};

exports.down = function(knex) {
  return knex.schema.table('cr_conversions', (tbl) => {
    tbl.dropColumn('conversions');
  });
};
