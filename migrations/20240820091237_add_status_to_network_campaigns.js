exports.up = function(knex) {
  return knex.schema.alterTable('network_campaigns', (table) => {
      table.text('status').defaultTo('');
    })
};

exports.down = function(knex) {
  return knex.schema.alterTable('network_campaigns', (table) => {
      table.dropColumn('status');
    });
};
