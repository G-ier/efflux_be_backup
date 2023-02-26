exports.up = function(knex) {
  return knex.schema.table('postback_events', (tbl) => {
    tbl.string('kwp');
  });
};

exports.down = function(knex) {
  return knex.schema.table('postback_events', (tbl) => {
    tbl.dropColumn('kwp')
  });
};
