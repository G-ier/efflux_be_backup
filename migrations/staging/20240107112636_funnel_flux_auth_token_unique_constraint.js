exports.up = function(knex) {
  return knex.schema.alterTable('funnel_flux_auth_token', (table) => {
    table.unique('user_id')
  })
};

exports.down = function(knex) {
  return knex.schema.alterTable('funnel_flux_auth_token', (table) => {
    table.dropUnique('user_id');
  })
};
