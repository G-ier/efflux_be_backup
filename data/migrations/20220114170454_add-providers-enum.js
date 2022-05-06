exports.up = function(knex) {
  return knex.raw(`
    CREATE TYPE providers AS ENUM ('facebook', 'google', 'auth0', 'outbrain', 'unknown');
    ALTER TABLE users
      ALTER COLUMN provider TYPE providers USING provider::providers,
      ALTER COLUMN provider SET DEFAULT 'unknown';
    ALTER TABLE user_accounts
      DROP CONSTRAINT user_accounts_provider_check,
      ALTER COLUMN provider TYPE providers USING provider::text::providers,
      ALTER COLUMN provider SET DEFAULT 'unknown';
    ALTER TABLE ad_accounts
      DROP CONSTRAINT ad_accounts_provider_check,
      ALTER COLUMN provider TYPE providers USING provider::text::providers,
      ALTER COLUMN provider SET DEFAULT 'unknown';
    ALTER TABLE campaigns
      DROP CONSTRAINT campaigns_traffic_source_check,
      ALTER COLUMN traffic_source TYPE providers USING traffic_source::text::providers,
      ALTER COLUMN traffic_source SET DEFAULT 'unknown';
  `)
};

exports.down = function(knex) {
  return knex.raw(`
    ALTER TABLE users
        ALTER COLUMN provider DROP DEFAULT,
        ALTER COLUMN provider TYPE varchar;
    ALTER TABLE user_accounts
      ALTER COLUMN provider DROP DEFAULT,
      ALTER COLUMN provider TYPE text,
      ADD CONSTRAINT user_accounts_provider_check CHECK (provider = ANY(ARRAY ['facebook'::text, 'google'::text]));
    ALTER TABLE ad_accounts
      ALTER COLUMN provider DROP DEFAULT,
      ALTER COLUMN provider TYPE text,
      ADD CONSTRAINT ad_accounts_provider_check CHECK (provider = ANY(ARRAY ['facebook'::text, 'google'::text]));
    ALTER TABLE campaigns
      ALTER COLUMN traffic_source TYPE providers USING traffic_source::text::providers,
      ALTER COLUMN traffic_source SET DEFAULT 'unknown',
      ADD CONSTRAINT campaigns_traffic_source_check CHECK (traffic_source = ANY(ARRAY ['facebook'::text, 'google'::text]));
    DROP TYPE providers;
  `)
};
