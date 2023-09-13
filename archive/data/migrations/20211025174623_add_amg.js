
exports.up = function(knex) {
  return knex.schema
    .raw(`ALTER TYPE campaign_network ADD VALUE IF NOT EXISTS 'amg'`)
    .createTable('amg', (tbl) => {
      tbl.increments();
      tbl.string("campaign_name");
      tbl.string("campaign_id");
      tbl.string("date");
      tbl.tinyint("hour");
      tbl.string('client_id');
      tbl.float("revenue");
      tbl.integer("clicks");
      tbl.integer("spam_clicks");
      tbl.integer("queries");
      tbl.integer("matched_queries");
      tbl.integer("spam_queries");
      tbl.integer("impressions");
      tbl.integer('spam_impressions');

      tbl.timestamp("created_at").notNullable().defaultTo(knex.fn.now());
      tbl.timestamp("updated_at").notNullable().defaultTo(knex.fn.now());
    })
};

exports.down = function(knex) {
  return knex.schema
    .dropTable('amg')
    .table('campaigns', (tbl) => {
      tbl.string('network').alter();
    })
};
