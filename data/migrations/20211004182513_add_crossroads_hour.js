
exports.up = function(knex) {
  return knex.schema.table("crossroads", (tbl) => {
    tbl.tinyint('hour');
  });
};

exports.down = function(knex) {
  return knex.schema.table("crossroads", (tbl) => {
    tbl.dropColumn('hour');
  });
};
