
exports.up = function(knex) {
    return knex.schema.createTable('bodis_domains', function(table) {
        table.integer('id').unique();
        table.string('name', 255);
        table.string('imprint', 255);
        table.string('vertical', 255);
        table.string('category', 255);
        table.string('tt_pixel', 255);
        table.string('fb_pixel', 255);
        table.timestamp('domain_creation_date');
        table.timestamp('created_at').defaultTo(knex.fn.now());
        table.timestamp('updated_at').defaultTo(knex.fn.now());
    }).then(() => {
        // Creating the Trigger separately
        return knex.raw(`
          CREATE TRIGGER updated_at
          BEFORE UPDATE ON bodis_domains
          FOR EACH ROW
          EXECUTE FUNCTION updated_at_column();
        `);
      });
};


exports.down = function(knex) {
    return knex.schema.dropTable('bodis_domains');
};
