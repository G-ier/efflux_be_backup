exports.up = function(knex) {
  return knex.schema.createTable('network_campaigns', function(table) {
    table.text('id');
    table.text('network');
    table.text('name');
    table.text('link');
    table.text('target');
    table.text('vertical');
    table.text('category');
    table.integer('network_account_id');
    table.timestamps(true, true);

    // Define composite primary key
    table.primary(['id', 'network']);

    // Define composite unique constraint (optional if already primary key)
    table.unique(['id', 'network'], 'network_campaigns_id_network_unique');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('network_campaigns');
};
