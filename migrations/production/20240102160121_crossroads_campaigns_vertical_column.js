
exports.up = function(knex) {
    return knex.schema.alterTable('crossroads_campaigns', function(table) {
        table.string('vertical').defaultTo("");
      });
};

exports.down = function(knex) {
    return knex.schema.alterTable('crossroads_campaigns', function(table) {
        table.dropColumn('vertical');
      });
};
