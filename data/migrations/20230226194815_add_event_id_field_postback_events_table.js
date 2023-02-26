exports.up = function(knex) {
  return knex.schema.table('postback_events', (tbl) => {
    tbl.string('event_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('postback_events', (tbl) => {
    tbl.dropColumn('event_id')
  });
};
