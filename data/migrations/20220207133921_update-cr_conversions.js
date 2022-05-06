exports.up = function(knex) {
  return knex.schema.table('cr_conversions', (tbl) => {
    tbl.string('section_id');
    tbl.enum("traffic_source", null, {
      useNative: true,
      existingType: true,
      enumName: "providers"
    }).notNullable().defaultTo("unknown");
  });
};

exports.down = function(knex) {
  return knex.schema.table('cr_conversions', (tbl) => {
    tbl.dropColumn('section_id');
    tbl.dropColumn('traffic_source');
  });
};
