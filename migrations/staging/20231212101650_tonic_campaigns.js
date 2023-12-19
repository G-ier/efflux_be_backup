exports.up = function(knex) {
    return knex.schema.createTable('tonic_campaigns', function(table) {
      table.integer('id').unique();
      table.string('name', 255);
      table.string('type', 255);
      table.string('country', 255);
      table.string('imprint', 255);
      table.string('offer_id', 255);
      table.string('offer', 255);
      table.string('vertical', 255);
      table.string('link', 255);
      table.string('target', 255);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.bigInteger('user_id');
      table.bigInteger('account_id');
  
      // Foreign Key Constraints
      table.foreign('user_id', 'crossroads_campaigns_user_id_foreign').references('id').inTable('users').onDelete('CASCADE');
      table.foreign('account_id', 'crossroads_campaigns_account_id_foreign').references('id').inTable('user_accounts').onDelete('CASCADE');
    })
    .then(() => {
      // Creating the Trigger separately
      return knex.raw(`
        CREATE TRIGGER updated_at
        BEFORE UPDATE ON tonic_campaigns
        FOR EACH ROW
        EXECUTE FUNCTION updated_at_column();
      `);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('tonic_campaigns');
  };
