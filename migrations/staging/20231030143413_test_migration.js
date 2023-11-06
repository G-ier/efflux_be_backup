
exports.up = function(knex) {
    return knex.schema.createTable('action_test', function(table) {
        table.string('test', 255);
      });
};

exports.down = function(knex) {
    return knex.schema.dropTable('action_test');
};
