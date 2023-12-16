
exports.up = function(knex) {
  return knex.schema.table('pb_analysis_data', (table) => {
      table.integer('minute');
    })
};

exports.down = function(knex) {
  return knex.schema.table('pb_analysis_data', (table) => {
      table.dropColumn('minute');
    });
};
