exports.up = function(knex) {
  return knex.schema.table('pages', (table) => {
    table.text('unique_identifier'); // Ensure this column exists
  })
  .then(() => {
    // Update 'unique_identifier' with concatenated values
    return knex.raw('UPDATE pages SET unique_identifier = CONCAT(id, \'_\', account_id)');
  })
  .then(() => {
    // Set 'unique_identifier' as the new primary key
    return knex.schema.table('pages', (table) => {
      table.primary('unique_identifier');
    });
  });
};

exports.down = function(knex) {
  return knex.schema.table('pages', (table) => {
    table.dropPrimary(); // Drops the primary key on 'unique_identifier'
    table.dropColumn('unique_identifier'); // Drops the 'unique_identifier' column
  });
};
