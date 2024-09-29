/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {

  return knex.schema
    .dropTableIfExists('table1')
    .then(() => knex.schema.dropTableIfExists('capi_logs'))
    .then(() => knex.schema.dropTableIfExists('facebook'))
    .then(() => knex.schema.dropTableIfExists('gtm_fb_cookie_values'))
    .then(() => knex.schema.dropTableIfExists('pb_analysis_data'))
    .then(() => knex.schema.dropTableIfExists('postback_events'))
    .then(() => knex.schema.dropTableIfExists('crossroads'))
    .then(() => knex.schema.dropTableIfExists('crossroads'))
    .then(() => knex.schema.dropTableIfExists('crossroads_raw_insights'))
    .then(() => knex.schema.dropTableIfExists('sedo'))
    .then(() => knex.schema.dropTableIfExists('sedo_domains'))
    .then(() => knex.schema.dropTableIfExists('tiktok'))
    .then(() => knex.schema.dropTableIfExists('tonic'))
    .then(() => knex.schema.dropTableIfExists('tonic_raw_insights'))
    .then(() => knex.schema.dropTableIfExists('taboola'))
    .then(() => knex.schema.dropTableIfExists('taboola_ads'))
    .then(() => knex.schema.dropTableIfExists('crossroad_accounts'))
    .then(() => knex.schema.dropTableIfExists('crossroads_campaigns'))
    .then(() => knex.schema.dropTableIfExists('finders'))
    .then(() => knex.schema.dropTableIfExists('medianet'))
    .then(() => knex.schema.dropTableIfExists('medianet_raw_insights'))
    .then(() => knex.schema.dropTableIfExists('raw_crossroads_data'))
    .then(() => knex.schema.dropTableIfExists('sedo_raw_events'))
    .then(() => knex.schema.dropTableIfExists('funnel_flux_auth_token'))
    .then(() => knex.schema.dropTableIfExists('funnel_flux_funnel_id_traffic_source_id'))
    .then(() => knex.schema.dropTableIfExists('tonic_campaigns'));
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // Code to recreate the tables if needed
};
