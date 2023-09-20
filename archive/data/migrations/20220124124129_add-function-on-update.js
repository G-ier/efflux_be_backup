exports.up = function(knex) {
  return knex.raw(`
    CREATE OR REPLACE FUNCTION updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
     NEW.updated_at = now();
     RETURN NEW;
    END;
    $$ language 'plpgsql';
  `)
};

exports.down = function(knex) {
  return knex.raw(`
    DROP FUNCTION IF EXISTS updated_at_column();
  `)
};
