
exports.up = function(knex) {
  return knex.schema.table('sedo2', function(table) {

    // Drop old columns
    table.dropColumn('lander_visits')
    table.dropColumn('lander_searches')
    table.dropColumn('revenue_events')
    table.dropColumn('total_visitors')
    table.dropColumn('total_visits')

    // Add new columns
    table.integer('pb_visits').defaultTo(0);
    table.integer('visitors').defaultTo(0);
    table.integer('pb_conversions').defaultTo(0);
    table.integer('conversions').defaultTo(0);
    table.float('pb_revenue').defaultTo(0);
    table.float('revenue').defaultTo(0).alter();
  });
};

exports.down = function(knex) {
  return knex.schema.table('sedo2', function(table) {

    // Add old columns
    table.integer('lander_visits');
    table.integer('lander_searches');
    table.integer('revenue_events');
    table.integer('total_visitors');
    table.integer('total_visits');

    // Drop new columns
    table.dropColumn('pb_visits');
    table.dropColumn('visitors');
    table.dropColumn('pb_conversions');
    table.dropColumn('conversions');
    table.dropColumn('pb_revenue');
    table.float('revenue').defaultTo(null).alter();
  });
};
