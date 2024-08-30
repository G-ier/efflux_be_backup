exports.up = function(knex) {
  return knex.schema.alterTable('crossroads_campaigns', (table) => {
      table.text('category').defaultTo('');
    })
};

exports.down = function(knex) {
  return knex.schema.alterTable('crossroads_campaigns', (table) => {
      table.dropColumn('category');
    });
};
