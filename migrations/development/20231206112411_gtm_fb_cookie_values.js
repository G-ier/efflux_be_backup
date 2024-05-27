exports.up = function(knex) {
  return knex.schema.createTable('gtm_fb_cookie_values', function(table) {
    table.text('session_id').primary();
    table.text('fbc');
    table.text('fbp');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  })
  .then(() => {
    // Creating the Trigger
    return knex.raw(`
      CREATE TRIGGER updated_at
      BEFORE UPDATE ON gtm_fb_cookie_values
      FOR EACH ROW
      EXECUTE FUNCTION updated_at_column();
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('gtm_fb_cookie_values');
};
