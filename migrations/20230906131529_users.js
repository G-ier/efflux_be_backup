exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('name', 255);
    table.string('email', 255);
    table.string('image_url', 255);
    table.string('nickname', 255);
    table.string('sub', 255);
    table.string('acct_type', 255);
    table.string('phone', 255);
    table.string('token', 255);
    table.string('fbID', 255);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    table.text('provider'); // NOTE: Add other provider values if needed
    table.string('providerId', 255);
  })
  .then(() => {
    return knex.raw(createUpdatedAtTriggerFunction());
  })
  .then(() => {
    return knex.raw(onUpdateTrigger('users'));
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('users');
};

const createUpdatedAtTriggerFunction = () => `
  CREATE OR REPLACE FUNCTION updated_at_column()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$ language 'plpgsql';
`;

const onUpdateTrigger = table => `
  CREATE TRIGGER updated_at
  BEFORE UPDATE ON ${table}
  FOR EACH ROW
  EXECUTE FUNCTION updated_at_column();
`;

