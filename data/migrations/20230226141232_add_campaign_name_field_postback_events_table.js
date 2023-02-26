exports.up = function(knex) {
  return knex.schema.table('postback_events', (tbl) => {
    tbl.string('campaign_name');
  });
};

exports.down = function(knex) {
  return knex.schema.table('postback_events', (tbl) => {
    tbl.dropColumn('campaign_name')
  });
};
