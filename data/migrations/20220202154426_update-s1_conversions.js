exports.up = function(knex) {
  return knex.schema.table('s1_conversions', (tbl) => {
    tbl.string('gclid');
    tbl.dropColumn('traffic_source');
  });
};

exports.down = function(knex) {
  return knex.schema.table('s1_conversions', (tbl) => {
    tbl.dropColumn('gclid');
    tbl.enum("traffic_source", null, {
      useNative: true,
      existingType: true,
      enumName: "providers"
    }).notNullable().defaultTo("unknown");
  });
};
