exports.up = function(knex) {
  return knex.schema.table('crossroads', (tbl) => {
    tbl.string('traffic_source');
  });
};

exports.down = function(knex) {
  return knex.schema.table('crossroads', (tbl) => {
    tbl.dropColumn('traffic_source')
  });
};
