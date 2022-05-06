exports.up = function(knex) {
  return knex.raw(`
    ALTER TABLE ad_accounts ALTER COLUMN network TYPE campaign_network USING network::text::campaign_network;
    ALTER TABLE ad_accounts ALTER COLUMN network SET DEFAULT 'unknown';
  `)
};

exports.down = function(knex) {
  return knex.raw(`
    ALTER TABLE ad_accounts ALTER COLUMN network TYPE VARCHAR;
    ALTER TABLE ad_accounts ALTER COLUMN network DROP DEFAULT;
  `)
};
