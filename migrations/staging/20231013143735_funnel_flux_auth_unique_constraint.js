exports.up = function(knex) {
  return knex.schema.table('funnel_flux_auth_token', function(table) {
    table.unique('user_id'); // This adds a unique constraint to the user_id column
  });
};

exports.down = function(knex) {
  return knex.schema.table('funnel_flux_auth_token', function(table) {
    table.dropUnique('user_id'); // This removes the unique constraint from the user_id column
  });
};
