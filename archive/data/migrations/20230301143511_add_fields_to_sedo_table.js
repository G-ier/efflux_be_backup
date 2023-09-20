exports.up = function(knex) {
  return knex.schema.table('sedo', (tbl) => {
    tbl.string('campaign_id');
    tbl.string('adset_id');
  });
};

exports.down = function(knex) {
  return knex.schema.table('sedo', (tbl) => {
    tbl.dropColumn('campaign_id')
    tbl.dropColumn('adset_id')
  });
};
