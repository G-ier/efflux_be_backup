exports.up = function (knex) {
  return knex.schema.createTable('cr_conversions', (tbl) => {
    tbl.increments();
    tbl.string('campaign_id');
    tbl.string('pixel_id');
    tbl.string('gclid', 5000);
    tbl.string('fbclid', 5000);
    tbl.text('referrer');
    tbl.string('browser');
    tbl.string('device_type');
    tbl.string('date');
    tbl.string('hour');
    tbl.string('city');
    tbl.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    tbl.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('cr_conversions');
};
