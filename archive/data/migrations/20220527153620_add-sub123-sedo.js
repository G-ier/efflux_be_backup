exports.up = function (knex) {
  return knex.schema.table('sedo', (tbl) => {
    tbl.string('sub1');
    tbl.string('sub2');
    tbl.string('sub3');
  });
};

exports.down = function (knex) {
  return knex.schema.table('sedo', (tbl) => {
    tbl.dropColumn('sub1');
    tbl.dropColumn('sub2');
    tbl.dropColumn('sub3');
  });
};
