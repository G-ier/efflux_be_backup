// migration for ad_metadata table

exports.up = function(knex) {
    return knex.schema.createTable('ad_metadata', table => {
      table.increments('id').primary();
      table.string('ad_name');
      table.string('ad_status');
      table.string('creative_name');
      table.text('asset_feed_spec'); // Storing as JSON string
      table.text('ad_id');
      table.timestamps(true, true); // Creates created_at and updated_at columns
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('ad_metadata');
  };
  