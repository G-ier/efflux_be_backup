exports.up = function(knex) {
  return knex.raw(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT constraint_name
        FROM information_schema.constraint_column_usage
        WHERE table_name = 'funnel_flux_auth_token' AND column_name = 'user_id'
      ) THEN
        ALTER TABLE funnel_flux_auth_token ADD CONSTRAINT user_id_unique UNIQUE (user_id);
      END IF;
    END
    $$;
  `);
};

exports.down = function(knex) {
  return knex.schema.table('funnel_flux_auth_token', function(table) {
    table.dropUnique('user_id');
  });
};
