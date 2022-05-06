exports.up = function (knex) {
  return knex.schema.table('facebook', (tbl) => {
    tbl.integer('impressions');
  });
};

exports.down = function (knex) {
  return knex.schema.table('facebook', (tbl) => {
    tbl.dropColumn('impressions');
  })
};
