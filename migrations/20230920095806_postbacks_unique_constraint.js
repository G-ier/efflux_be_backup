exports.up = function(knex) {
  return knex.schema.table('postback_events', table => {
      table.unique('event_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('postback_events', table => {
      table.dropUnique('event_id');
  });
};
