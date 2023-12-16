exports.up = function(knex) {
  return knex.schema.createTable('tt_pixels', function(table) {
    table.string('id').primary();
    table.text('pixel_id');
    table.text('code');
    table.text('name');
    table.text('creation_time');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.text('category');
    table.text('mode');
    table.text('status');
    table.integer('user_id');
    table.integer('account_id');
    table.integer('ad_account_id');
    table.text('provider_id');

    // Foreign Key Constraints
    table.foreign('user_id', 'fb_pixels_user_id_foreign').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('account_id', 'foreign_user_account_id').references('id').inTable('user_accounts').onDelete('CASCADE');
    table.foreign('ad_account_id', 'foreign_ad_account_id').references('id').inTable('ad_accounts').onDelete('CASCADE');
  })
  .then(() => {
    // Creating the Trigger
    return knex.raw(`
      CREATE TRIGGER updated_at
      BEFORE UPDATE ON tt_pixels
      FOR EACH ROW
      EXECUTE FUNCTION updated_at_column();
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('tt_pixels');
};
