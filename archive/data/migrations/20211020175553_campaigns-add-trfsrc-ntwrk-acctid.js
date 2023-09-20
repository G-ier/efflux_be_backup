exports.up = function (knex) {
  return knex.schema.table('campaigns', (tbl) => {
    tbl.enum('traffic_source', ['facebook', 'google']);
    tbl.enum('network', ['crossroads', 'other']).default('crossroads');
    tbl.integer('account_id').unsigned();
    tbl.foreign('account_id').references('id').inTable('user_accounts');
    tbl.integer('ad_account_id').unsigned();
    tbl.foreign('ad_account_id').references('id').inTable('ad_accounts')
    tbl.dropColumn('provider');
  });
};

exports.down = function (knex) {
  return knex.schema.table('campaigns', (tbl) => {
    tbl.dropColumn('traffic_source');
    tbl.dropColumn('network');
    tbl.dropColumn('account_id');
    tbl.dropColumn('ad_account_id');
    tbl.enum('provider', ['facebook', 'google']);
  });
};
