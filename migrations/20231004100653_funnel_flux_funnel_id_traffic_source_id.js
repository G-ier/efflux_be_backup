
exports.up = function(knex) {
  return knex.schema.createTable("funnel_flux_funnel_id_traffic_source_id", (tbl) => {
    tbl.increments('id').primary();
    tbl.text("funnel_id")
    tbl.text("funnel_name")
    tbl.text("traffic_source_id")
    tbl.text("traffic_source_name")

    // Add unique constraint for the combination of funnel_id and traffic_source_id
    tbl.unique(["funnel_id", "traffic_source_id"]);

  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('funnel_flux_funnel_id_traffic_source_id');
};
