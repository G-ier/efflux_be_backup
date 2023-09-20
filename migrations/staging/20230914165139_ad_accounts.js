exports.up = function(knex) {
  return knex.schema.createTable('ad_accounts', (table) => {
    table.bigIncrements('id').primary();
    table.text('provider');
    table.string('provider_id', 255);
    table.string('name', 255);
    table.string('status', 255);
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.integer('account_id').unsigned().references('id').inTable('user_accounts').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.text('network'); // NOTE: Add other network values if needed
    table.string('amount_spent', 255);
    table.string('balance', 255);
    table.string('spend_cap', 255);
    table.string('currency', 255);
    table.string('tz_name', 255);
    table.smallint('tz_offset');
    table.string('fb_account_id', 255);
    table.string('date_start', 255);
    table.float('today_spent', 8, 2).defaultTo(0);

    // Explicit naming for composite unique constraint
    table.unique(['account_id', 'provider', 'provider_id'], 'ad_accounts_account_id_provider_provider_id_unique');
  })
  .then(() => {
    return knex.raw(onUpdateTrigger('ad_accounts'));
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('ad_accounts');
};

const onUpdateTrigger = table => `
  CREATE TRIGGER updated_at
  BEFORE UPDATE ON ${table}
  FOR EACH ROW
  EXECUTE FUNCTION updated_at_column();
`;
