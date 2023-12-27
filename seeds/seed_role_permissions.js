/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */

exports.seed = async function (knex) {
  return knex('role_permissions')
    .del()
    .then(async function () {
      // Retrieve IDs of roles and permissions
      const roles = await knex.select('id', 'name').from('roles');
      const permissions = await knex.select('id', 'name').from('permissions');

      // Helper function to get ID by name
      const getIdByName = (collection, name) => collection.find((item) => item.name === name).id;

      // Create associations
      return knex('role_permissions').insert([
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'manage_ad_accounts'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'manage_users'),
        },
        // ... other role permission associations for Org Admin
        {
          role_id: getIdByName(roles, 'media_buyer'),
          permission_id: getIdByName(permissions, 'read_reports'),
        },
        // ... other role permission associations for Media Buyer
        {
          role_id: getIdByName(roles, 'creatives'),
          permission_id: getIdByName(permissions, 'manage_media_library'),
        },
        // ... other role permission associations for Creatives
        {
          role_id: getIdByName(roles, 'support_staff'),
          permission_id: getIdByName(permissions, 'read_reports'),
        },
        // ... other role permission associations for Support Staff
      ]);
    });
};
