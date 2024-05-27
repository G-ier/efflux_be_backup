exports.up = function(knex) {
    return knex.schema.hasTable('content').then(function(exists) {
      if (exists) {
        return knex.schema.renameTable('content', 'ad_launcher_media');
      }
    });
  };
  
  exports.down = function(knex) {
    return knex.schema.hasTable('ad_launcher_media').then(function(exists) {
      if (exists) {
        return knex.schema.renameTable('ad_launcher_media', 'content');
      }
    });
  };
  