// migration for campaign_metadata table

exports.up = function(knex) {
    return knex.schema.createTable('campaign_metadata', table => {
      table.increments('id').primary();
      table.string('name');
      table.string('objective');
      table.text('special_ad_categories'); // Storing as JSON string
      table.string('special_ad_category_country');
      table.string('campaign_id');
      table.timestamps(true, true); // Creates created_at and updated_at columns
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('campaign_metadata');
  };
  