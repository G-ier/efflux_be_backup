exports.up = function(knex) {
    return knex.schema.alterTable('raw_crossroads_data', (table) => {
        table.bool('valid_pixel').defaultTo(true);
      })
};

exports.down = function(knex) {
    return knex.schema.alterTable('raw_crossroads_data', (table) => {
        table.dropColumn('valid_pixel');
      });
};
