exports.up = function(knex) {
  return knex.schema.table('crossroads_stats', (tbl) => {
    tbl.string('campaign_name');
    tbl.string('adset_name');
  });
};

exports.down = function(knex) {
  return knex.schema.table('crossroads_stats', (tbl) => {
    tbl.dropColumn('campaign_name')
    tbl.dropColumn('adset_name')
  });
};
