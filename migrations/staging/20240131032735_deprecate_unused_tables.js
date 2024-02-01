/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .raw('alter table ads rename to deprecated_ads;')
    .raw('alter table ad_queue rename to deprecated_ad_queue;')
    .raw('alter table campaign_metadata rename to deprecated_campaign_metadata;')
    .raw('alter table ad_metadata rename to deprecated_ad_metadata;')
    .raw('alter table facebook_ads rename to deprecated_facebook_ads;')
    .raw('alter table funnel_flux_funnel_id_traffic_source_id rename to deprecated_funnel_flux_funnel_id_traffic_source_id;');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  // You may want to add the reverse operations in case you need to rollback the migration
  return knex.schema
    .raw('alter table deprecated_ads rename to ads;')
    .raw('alter table deprecated_ad_queue rename to ad_queue;')
    .raw('alter table deprecated_campaign_metadata rename to campaign_metadata;')
    .raw('alter table deprecated_ad_metadata rename to ad_metadata;')
    .raw('alter table deprecated_facebook_ads rename to facebook_ads;')
    .raw('alter table deprecated_funnel_flux_funnel_id_traffic_source_id rename to funnel_flux_funnel_id_traffic_source_id;');
};

