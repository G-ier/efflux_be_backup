exports.up = function(knex) {
  return knex.schema.createTable('operational_errors', (table) => {
    table.string('id').notNullable();
    table.string('traffic_source').notNullable();
    table.string('ad_account_name')
    table.string('campaign_name');
    table.string('adset_name');
    table.string('ad_name');
    table.string('type').notNullable();
    table.text('description');
    table.boolean('resolved').defaultTo(false);
    table.timestamps(true, true);
    table.unique(['id', 'traffic_source', 'type']);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('operational_errors');
};
