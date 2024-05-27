exports.up = function(knex) {
  return knex.schema.createTable('campaigns', function(table) {
    table.string('id', 255).primary().notNullable();
    table.string('name', 255);
    table.string('status', 255);
    table.integer('user_id');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.text('traffic_source');
    table.integer('account_id');
    table.bigint('ad_account_id');
    table.text('network');  // Please add more network values if needed.
    table.string('strategy_id', 255);
    table.string('daily_budget', 255);
    table.string('lifetime_budget', 255);
    table.string('created_time', 255);
    table.string('start_time', 255);
    table.string('stop_time', 255);
    table.string('budget_remaining', 255);
    table.string('updated_time', 255);
    table.string('optimizationtype');

    // Foreign Key Constraints
    table.foreign('user_id', 'campaigns_user_id_foreign').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('account_id', 'foreign_user_account_id').references('id').inTable('user_accounts').onDelete('CASCADE');
    table.foreign('ad_account_id', 'campaigns_ad_account_id_foreign').references('id').inTable('ad_accounts').onDelete('CASCADE');
  })
  .then(() => {
    // Creating the Trigger
    return knex.raw(`
      CREATE TRIGGER updated_at
      BEFORE UPDATE ON campaigns
      FOR EACH ROW
      EXECUTE FUNCTION updated_at_column();
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('campaigns');
};
