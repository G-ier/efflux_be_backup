exports.up = function(knex) {
  return knex.raw(`
    CREATE OR REPLACE FUNCTION delete_network_campaigns_user_relations()
    RETURNS TRIGGER AS $$
    BEGIN
      DELETE FROM network_campaigns_user_relations
      WHERE user_id = OLD.u_id
        AND (network_campaign_id, network) IN (
          SELECT DISTINCT aancm.network_campaign_id, aancm.network
          FROM ad_accounts_network_campaigns_map aancm
          WHERE aancm.ad_account_id = OLD.aa_id
        )
        AND source = 'automatic';
      RETURN OLD;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER delete_network_campaigns_user_relations_trigger
    AFTER DELETE ON u_aa_map
    FOR EACH ROW
    EXECUTE FUNCTION delete_network_campaigns_user_relations();
  `);
};

exports.down = function(knex) {
  return knex.raw(`
    DROP TRIGGER IF EXISTS delete_network_campaigns_user_relations_trigger ON u_aa_map;
    DROP FUNCTION IF EXISTS delete_network_campaigns_user_relations();
  `);
};
