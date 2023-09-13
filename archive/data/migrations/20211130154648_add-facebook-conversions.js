
exports.up = function(knex) {
  return knex.schema.table('facebook', (tbl) => {
    tbl.integer('conversions').defaultTo(0);
  });
};

exports.down = function(knex) {
  return knex.schema.table('facebook', (tbl) => {
    tbl.dropColumn('conversions');
  });
};
