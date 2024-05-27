
exports.up = function(knex) {
  return knex.schema.table('raw_crossroads_data', (table) => {
      table.string('traffic_source').defaultTo('Unkown');
      table.boolean('reported_to_ts').defaultTo(false);
    })
};

exports.down = function(knex) {
  return knex.schema.table('raw_crossroads_data', (table) => {
      table.dropColumn('traffic_source');
      table.dropColumn('reported_to_ts');
    });
};
