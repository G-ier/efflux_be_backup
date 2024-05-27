exports.up = function(knex) {
    return knex.schema.alterTable('funnel_flux_auth_token', function(table) {
      table.unique('user_id', 'funnel_flux_auth_token_user_id_unique');
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.alterTable('funnel_flux_auth_token', function(table) {
      table.dropUnique(['user_id'], 'funnel_flux_auth_token_user_id_unique');
    });
  };