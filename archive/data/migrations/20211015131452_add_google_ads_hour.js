exports.up = function (knex) {
  return knex.schema.table('google_ads', (tbl) => {
    tbl.tinyint('hour');
  });
};

exports.down = function (knex) {
  return knex.schema.table('google_ads', (tbl) => {
    tbl.dropColumn('hour');
  });
};
