exports.up = function(knex) {
  return knex.schema.createTable('user_accounts', (table) => {
    table.increments('id').primary();
    table.string('name', 255);
    table.string('email', 255);
    table.text('image_url');
    table.text('provider'); // NOTE: Add other provider values if needed
    table.string('provider_id', 255);
    table.string('status', 255);
    table.text('token').unique('unique_token');
    table.integer('user_id').unsigned().references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.string('business_scoped_id', 50).defaultTo('');
  })
  .then(() => {
    return knex.raw(onUpdateTrigger('user_accounts'));
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('user_accounts');
};

const onUpdateTrigger = table => `
  CREATE TRIGGER updated_at
  BEFORE UPDATE ON ${table}
  FOR EACH ROW
  EXECUTE FUNCTION updated_at_column();
`;

