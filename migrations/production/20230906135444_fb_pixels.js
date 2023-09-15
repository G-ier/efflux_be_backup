exports.up = function(knex) {
  return knex.schema.createTable('fb_pixels', function(table) {
    table.increments('id').primary();
    table.string('pixel_id', 255);
    table.string('domain', 255);
    table.string('token', 255);
    table.string('bm', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.string('name', 255);
    table.integer('user_id');
    table.integer('account_id');
    table.string('business_id', 255);
    table.string('business_name', 255);
    table.boolean('is_unavailable');
    table.string('data_use_setting', 255);
    table.string('last_fired_time', 255);
    table.string('creation_time', 255);
    table.string('pixel_id_ad_account_id', 255).unique();

    // Foreign Key Constraints
    table.foreign('user_id', 'fb_pixels_user_id_foreign').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('account_id', 'foreign_user_account_id').references('id').inTable('user_accounts').onDelete('CASCADE');
  })
  .then(() => {
    // Creating the Trigger
    return knex.raw(`
      CREATE TRIGGER updated_at
      BEFORE UPDATE ON fb_pixels
      FOR EACH ROW
      EXECUTE FUNCTION updated_at_column();
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('fb_pixels');
};
