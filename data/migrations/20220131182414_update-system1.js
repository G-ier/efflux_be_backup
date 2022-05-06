exports.up = function(knex) {
  return knex.schema.table('system1', (tbl) => {
    tbl.string('utc_hour');
    tbl.string('last_updated');
  });
};

exports.down = function(knex) {
  return knex.schema.table('system1', (tbl) => {
    tbl.dropColumn('utc_hour');
    tbl.dropColumn('last_updated');
  });
};
