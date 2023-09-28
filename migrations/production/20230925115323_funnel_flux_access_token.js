exports.up = function(knex) {
  return knex.schema.createTable("funnel_flux_auth_token", (tbl) => {
    tbl.text("access_token").primary()
    tbl.text("refresh_token")
    tbl.bigInteger("expires_at")
    tbl.string("user_id")
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists("funnel_flux_auth_token");
};
