exports.up = function(knex) {
  return knex.schema.alterTable('sedo', function(table) {
    // Modify columns to match character varying(255)
    table.string('date', 255).alter();
    table.string('traffic_source', 255).alter();
    table.string('campaign_id', 255).alter();
    table.string('adset_id', 255).alter();
    table.string('ad_id', 255).alter();
    table.integer('visitors').defaultTo(0).alter();

    // Add new columns
    table.smallint('hour');
    table.integer('pb_visits').defaultTo(0);
    table.integer('pb_conversions').defaultTo(0);
    table.integer('conversions').defaultTo(0);
    table.float('pb_revenue').defaultTo(0); // Corrected this line for the pb_revenue column.

    // Remove columns from sedo that aren't in sedo2
    table.dropColumn('funnel_id');
    table.dropColumn('hit_id');
    table.dropColumn('clicks');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('sedo', function(table) {
    // Revert columns to their original size
    table.string('date', 10).alter();
    table.text('traffic_source').alter();
    table.text('campaign_id').alter();
    table.text('adset_id').alter();
    table.text('ad_id').alter();

    // Remove added columns
    table.dropColumn('hour');
    table.dropColumn('pb_visits');
    table.dropColumn('pb_conversions');
    table.dropColumn('conversions');
    table.dropColumn('pb_revenue');

    // Add back the removed columns to revert the migration
    table.text('funnel_id');
    table.text('hit_id');
    table.integer('clicks');
  });
};
