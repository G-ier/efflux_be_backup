
exports.up = function(knex) {
  return knex.schema.table('capi_logs', (table) => {
    table.boolean('constructed_fbc').defaultTo(false);
    table.boolean('constructed_fbp').defaultTo(false);
    table.text('unique_identifier').unique();
  });
};

exports.down = function(knex) {
  return knex.schema.table('capi_logs', (table) => {
    table.dropColumn('constructed_fbc');
    table.dropColumn('constructed_fbp');
    table.dropColumn('unique_identifier');
  });
};
