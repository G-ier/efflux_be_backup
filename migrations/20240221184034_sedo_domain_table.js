exports.up = function(knex) {
    return knex.schema.createTable('sedo_domains', table => {
      table.string('domain').primary(); // domain as the primary key
      table.string('categories');
      table.boolean('forsale');
      table.float('price'); 
      table.float('minprice');
      table.float('fixedprice');
      table.string('currency');
      table.string('domainlanguage');        
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
  }).then(() => {
      // Creating the Trigger separately
      return knex.raw(`
        CREATE TRIGGER updated_at
        BEFORE UPDATE ON sedo_domains
        FOR EACH ROW
        EXECUTE FUNCTION updated_at_column();
      `);
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.dropTable('sedo_domains');
  };