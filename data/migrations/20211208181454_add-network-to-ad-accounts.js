
exports.up = function(knex) {
  return knex.schema.table('ad_accounts', (tbl) => {
    tbl.enum('network', ['crossroads', 'amg', 'unknown'], { useNative: true, existingType: true, enumName: 'campaign_network' }).default('unknown');
  });
};

exports.down = function(knex) {
  return knex.schema.table('ad_accounts', (tbl) => {
    tbl.dropColumn('network');
  });
};
