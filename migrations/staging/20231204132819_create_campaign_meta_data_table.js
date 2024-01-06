// migration for campaign_metadata table

exports.up = function(knex) {
    return knex.schema.createTable('campaign_metadata', table => {
      table.increments('id').primary();
      table.string('name');
      table.string('objective');
      table.text('special_ad_category');
      table.string('special_ad_category_country');
      table.text('campaign_id').references('id').inTable('campaigns');
      table.timestamps(true, true); // Creates created_at and updated_at columns
    });
  };

  exports.down = function(knex) {
    return knex.schema.dropTable('campaign_metadata');
  };
