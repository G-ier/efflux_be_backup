exports.up = function(knex) {
  return knex.raw(`
    ALTER TYPE campaign_network RENAME TO networks;
    ALTER TABLE campaigns ALTER COLUMN network TYPE networks;
    ALTER TABLE campaigns ALTER COLUMN network SET DEFAULT 'unknown';
    ALTER TABLE ad_accounts ALTER COLUMN network TYPE networks;
    ALTER TABLE ad_accounts ALTER COLUMN network SET DEFAULT 'unknown';
  `)
};

exports.down = function(knex) {
  return knex.raw(`
    ALTER TYPE networks RENAME TO campaign_network;
    ALTER TABLE campaigns ALTER COLUMN network TYPE networks;
    ALTER TABLE campaigns ALTER COLUMN network SET DEFAULT 'unknown';
    ALTER TABLE ad_accounts ALTER COLUMN network TYPE networks;
    ALTER TABLE ad_accounts ALTER COLUMN network SET DEFAULT 'unknown';
  `)
};
