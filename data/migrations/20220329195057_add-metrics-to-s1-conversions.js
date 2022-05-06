exports.up = function(knex) {
  return knex.schema.table('s1_conversions', (tbl) => {
    tbl.integer('impressions').defaultTo(0)
    tbl.integer('searches').defaultTo(0)
  });
};

exports.down = function(knex) {
  return knex.schema.table('s1_conversions', (tbl) => {
    tbl.dropColumn('impressions')
    tbl.dropColumn('searches')
  });
};
