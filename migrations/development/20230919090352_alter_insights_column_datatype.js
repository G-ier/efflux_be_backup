exports.up = function(knex) {
  return knex.schema.alterTable('insights', function(table) {
    table.text('campaign_id').alter();
    table.text('adset_id').alter();
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('insights', function(table) {
    // Here, you can define a reversal action, e.g., setting the column back to its previous type.
    // In this case, I've assumed it was varchar with length 255. Adjust as per your original schema.
    table.string('campaign_id', 30).alter();
    table.string('adset_id', 30).alter();
  });
};
