exports.up = function(knex) {
  return knex.schema.table('adsets', (tbl) => {
    tbl.unique(['provider_id', 'traffic_source']);
  });
};

exports.down = function(knex) {
  return knex.schema.table('adsets', (tbl) => {
    tbl.dropUnique(['provider_id', 'traffic_source']);
  });
};
