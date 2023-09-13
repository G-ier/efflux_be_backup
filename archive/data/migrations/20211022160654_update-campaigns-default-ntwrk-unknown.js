
exports.up = function(knex) {
  return knex.schema.table('campaigns', (tbl) => {
    tbl.enum('network', ['crossroads', 'amg', 'unknown'], { useNative: true, enumName: 'campaign_network' }).default('unknown');
  })
};

exports.down = function(knex) {
  return knex.schema.table('campaigns', (tbl) => {
    tbl.dropColumn('network');
  }).raw('DROP TYPE IF EXISTS campaign_network');
};
