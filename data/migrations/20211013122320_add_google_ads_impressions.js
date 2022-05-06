
exports.up = function(knex) {
  return knex.schema.table("google_ads", (tbl) => {
    tbl.integer('impressions');
    tbl.integer('conversions');
  });
};

exports.down = function(knex) {
  return knex.schema.table("google_ads", (tbl) => {
    tbl.dropColumn('impressions');
    tbl.dropColumn('conversions');
  });
};
