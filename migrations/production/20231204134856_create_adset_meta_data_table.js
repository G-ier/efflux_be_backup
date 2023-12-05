// migration for adset_metadata table

exports.up = function(knex) {
    return knex.schema.createTable('adset_metadata', table => {
      table.increments('id').primary();
      table.string('name');
      table.string('status');
      table.decimal('daily_budget');
      table.text('special_ad_category'); // Storing as JSON string
      table.string('special_ad_category_country');
      table.string('dsa_beneficiary');
      table.string('dsa_payor');
      table.string('optimization_goal');
      table.string('billing_event');
      table.boolean('is_dynamic_creative');
      table.text('promoted_object'); // Storing as JSON string
      table.text('targeting'); // Storing as JSON string
      table.text('attribution_spec'); // Storing as JSON string
      table.integer('adset_id').unsigned().references('provider_id').inTable('');
      table.timestamps(true, true); // Creates created_at and updated_at columns
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('adset_metadata');
  };
  