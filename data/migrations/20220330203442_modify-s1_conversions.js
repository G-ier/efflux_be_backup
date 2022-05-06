exports.up = function(knex) {
  return knex.schema.table('s1_conversions', (tbl) => {
    tbl.dropColumn('fbclick')
    tbl.dropColumn('searches')
    tbl.dropColumn('impressions')
  });
};

exports.down = function(knex) {
  return knex.schema.table('s1_conversions', (tbl) => {
    tbl.string('fbclick')
    tbl.integer('searches').defaultTo(0)
    tbl.integer('impressions').defaultTo(0)
  });
};
