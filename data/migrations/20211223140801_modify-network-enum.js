exports.up = function(knex) {
  return knex.raw(`
    ALTER TYPE campaign_network ADD VALUE 'proper';
    ALTER TYPE campaign_network ADD VALUE 'system1';
  `)
};

exports.down = function(knex) {
  return
};
