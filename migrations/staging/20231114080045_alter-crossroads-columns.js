exports.up = function(knex) {
  return knex.schema.alterTable('crossroads', function(table) {
    table.text('campaign_name').alter();
    table.text('cr_camp_name').alter();
    table.text('adset_name').alter();
    table.text('campaign_id').alter();
    table.text('ad_id').alter();
    table.text('pixel_id').alter();
    table.text('adset_id').alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('crossroads', function(table) {
    table.string('campaign_name', 255).alter();
    table.string('cr_camp_name', 255).alter();
    table.string('adset_name', 255).alter();
    table.string('campaign_id', 255).alter();
    table.string('ad_id', 255).alter();
    table.string('pixel_id', 255).alter();
    table.string('adset_id', 255).alter();
  });
};
