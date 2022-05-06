
exports.up = function(knex) {
  return knex.schema.table("facebook", (tbl) => {
    tbl.tinyint('hour');
  });
};

exports.down = function(knex) {
  return knex.schema.table("facebook", (tbl) => {
    tbl.dropColumn('hour');
  });
};
