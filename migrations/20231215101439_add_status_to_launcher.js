exports.up = function(knex) {
  return knex.schema.alterTable('ad_launcher_queue', (table) => {
    // Add a new column for status with a default value of 'Queued'
    table.string('status').defaultTo('Queued');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('ad_launcher_queue', (table) => {
    // Remove the status column
    table.dropColumn('status');
  });
};
