exports.up = function(knex) {
  return knex.schema.createTable('adsets', function(table) {
    table.bigInteger('id').primary();
    table.string('provider_id', 255).unique();
    table.string('name', 255);
    table.string('campaign_id', 255);
    table.bigint('ad_account_id');
    table.integer('user_id');
    table.integer('account_id');
    table.text('traffic_source');
    table.text('network');
    table.string('status', 255);
    table.string('daily_budget', 255);
    table.string('lifetime_budget', 255);
    table.string('budget_remaining', 255);
    table.string('created_time', 255);
    table.string('start_time', 255);
    table.string('stop_time', 255);
    table.string('updated_time', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Unique Constraints
    table.unique(['provider_id', 'traffic_source'], 'adsets_provider_id_traffic_source_unique');

    // Foreign Key Constraints
    table.foreign('ad_account_id', 'adsets_ad_account_id_foreign').references('id').inTable('ad_accounts').onDelete('CASCADE');
    table.foreign('campaign_id', 'adsets_campaign_id_foreign').references('id').inTable('campaigns').onDelete('CASCADE');
    table.foreign('user_id', 'adsets_user_id_foreign').references('id').inTable('users').onDelete('CASCADE');
    table.foreign('account_id', 'foreign_user_account_id').references('id').inTable('user_accounts').onDelete('CASCADE');
  })
  .then(() => {
    // Creating the Trigger
    return knex.raw(`
      CREATE TRIGGER updated_at
      BEFORE UPDATE ON adsets
      FOR EACH ROW
      EXECUTE FUNCTION updated_at_column();
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('adsets')
    .then(() => {
      return knex.raw('DROP SEQUENCE IF EXISTS adsets_id_seq;');
    });
};
