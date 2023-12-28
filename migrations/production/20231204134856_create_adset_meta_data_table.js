exports.up = function (knex) {
  return knex.schema.createTable('adset_metadata', (table) => {
    table.increments('id').primary();
    table.string('name').defaultTo('');
    table.string('status');
    table.decimal('daily_budget').defaultTo(20);
    table.text('special_ad_category').defaultTo('NONE');
    table.string('special_ad_category_country').defaultTo('');
    table.string('dsa_beneficiary').defaultTo('');
    table.string('dsa_payor').defaultTo('');
    table.string('optimization_goal').defaultTo('OFFSITE_CONVERSIONS');
    table.string('billing_event').defaultTo('IMPRESSIONS');
    table.boolean('is_dynamic_creative').defaultTo(true);

    // New columns for target settings
    table.integer('age_min').defaultTo(18);
    table.integer('age_max').defaultTo(65);
    // Defining countries as a TEXT array
    table.specificType('countries', 'TEXT[]').defaultTo(knex.raw('ARRAY[]::TEXT[]'));
    table.string('user_os').defaultTo('');
    table.specificType('gender', 'TEXT[]').defaultTo(knex.raw('ARRAY[]::TEXT[]'));

    // New columns for click_through and view_through
    table.integer('click_through').defaultTo(1);
    table.integer('view_through').defaultTo(0);
    // New column for pixelId
    table.string('pixel_id').defaultTo('');

    table.text('adset_id').unsigned().references('provider_id').inTable('adsets'); // Adjust as needed
    table.timestamps(true, true); // Creates created_at and updated_at columns
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable('adset_metadata');
};
