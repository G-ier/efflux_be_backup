exports.up = function(knex) {
  return knex.raw(`
    -- Insert trigger function
    CREATE OR REPLACE FUNCTION insert_network_campaigns_user_relations()
    RETURNS TRIGGER AS $$
    BEGIN
      INSERT INTO network_campaigns_user_relations (user_id, network_campaign_id, network, source)
      SELECT NEW.u_id, aancm.network_campaign_id, aancm.network, 'automatic'
      FROM ad_accounts_network_campaigns_map aancm
      WHERE aancm.ad_account_id = NEW.aa_id
      ON CONFLICT (user_id, network_campaign_id, network) DO NOTHING;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Insert trigger
    CREATE TRIGGER insert_network_campaigns_user_relations_trigger
    AFTER INSERT ON u_aa_map
    FOR EACH ROW
    EXECUTE FUNCTION insert_network_campaigns_user_relations();
  `);
};

exports.down = function(knex) {
  return knex.raw(`
    DROP TRIGGER IF EXISTS insert_network_campaigns_user_relations_trigger ON u_aa_map;
    DROP FUNCTION IF EXISTS insert_network_campaigns_user_relations();
  `);
};
