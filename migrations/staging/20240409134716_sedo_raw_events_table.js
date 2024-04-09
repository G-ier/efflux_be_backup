/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('sedo_raw_events', function(table) {
    table.string('click_timestamp');
    table.string('domain');
    table.string('kwp');
    table.float('revenue');
    table.string('sub1');
    table.string('sub2');
    table.string('sub3');
    table.string('txid');
    table.string('accountId');
    table.string('apiId');
    table.string('domainName');
    table.string('requestId');
    table.string('timestamp');
    table.string('received_at');
    table.boolean('is_postback');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('raw_events');
};
