
exports.up = function(knex) {
  return knex.schema.table('campaigns', (tbl) => {
    tbl.dropColumn('network');
  });
};

exports.down = function(knex) {
  return knex.schema.table('campaigns', (tbl) => {
    tbl.enum('network', ['crossroads', 'other']).defaultTo('crossroads');
  })
};
