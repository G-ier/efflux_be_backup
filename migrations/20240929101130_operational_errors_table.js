exports.up = function(knex) {
  return knex.schema.createTable('operational_errors', (table) => {
    table.string('id').notNullable();
    table.string('traffic_source').notNullable();
    table.string('network');
    table.string('network_campaign_name');
    table.string('ad_account_name');
    table.string('campaign_name');
    table.string('adset_name');
    table.string('ad_name');
    table.enu('type', [
      'Adset Not Tracking Conversions',
      'Query String Error',
      'Ad Not Using Our Tracker',
      'Cross Ad Accounts Offers'
    ]).notNullable();
    table.text('description');
    table.boolean('resolved').defaultTo(false);
    table.timestamps(true, true);
    table.unique(['id', 'traffic_source', 'type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('operational_errors');
};
