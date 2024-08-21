exports.up = function(knex) {
  return knex.schema.createTable('ad_launcher_queue', (table) => {
    table.increments('id').primary(); // Primary key, auto-increments
    table.string('traffic_source'); // Traffic source field
    table.string('ad_account_id'); // Ad account ID field

    // Foreign keys linking to other metadata tables
    table.integer('campaign_metadata_id').unsigned(); // Campaign metadata ID field
    table.foreign('campaign_metadata_id').references('campaign_metadata.id');

    table.integer('ad_metadata_id').unsigned(); // Ad metadata ID field
    table.foreign('ad_metadata_id').references('ad_metadata.id');

    table.integer('adset_metadata_id').unsigned(); // Adset metadata ID field
    table.foreign('adset_metadata_id').references('adset_metadata.id');

    // Add any additional fields or constraints as needed
  });
};

exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('ad_launcher_queue'); // Drop the ad_launcher_queue table
};
