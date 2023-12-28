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
        // Admin role permissions
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'launch_ads'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'create_campaigns'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'delete_campaigns'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'edit_campaigns'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'start_campaigns'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'stop_campaigns'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'assign_campaigns'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'create_adsets'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'read_adsets'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'delete_adsets'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'edit_adsets'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'create_ads'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'read_ads'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'delete_ads'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'edit_ads'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'manage_media_library'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'upload_media'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'edit_media'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'delete_media'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'read_media_library'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'manage_reports'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'read_reports'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'download_reports'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'invite_users'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'read_users'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'delete_users'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'read_organization'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'edit_organization'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'read_ad_accounts'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'create_pixels'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'edit_pixels'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'delete_pixels'),
        },
        {
          role_id: getIdByName(roles, 'org_admin'),
          permission_id: getIdByName(permissions, 'read_pixels'),
        },

        // Media Buyer role permissions
        {
          role_id: getIdByName(roles, 'media_buyer'),
          permission_id: getIdByName(permissions, 'read_media_library'),
        },
        {
          role_id: getIdByName(roles, 'media_buyer'),
          permission_id: getIdByName(permissions, 'read_reports'),
        },
        {
          role_id: getIdByName(roles, 'media_buyer'),
          permission_id: getIdByName(permissions, 'read_campaigns'),
        },
        {
          role_id: getIdByName(roles, 'media_buyer'),
          permission_id: getIdByName(permissions, 'read_adsets'),
        },
        {
          role_id: getIdByName(roles, 'media_buyer'),
          permission_id: getIdByName(permissions, 'read_ads'),
        },
        {
          role_id: getIdByName(roles, 'media_buyer'),
          permission_id: getIdByName(permissions, 'launch_ads'),
        },
        // Creative role permissions
        {
          role_id: getIdByName(roles, 'creatives'),
          permission_id: getIdByName(permissions, 'upload_media'),
        },
        {
          role_id: getIdByName(roles, 'creatives'),
          permission_id: getIdByName(permissions, 'edit_media'),
        },
        {
          role_id: getIdByName(roles, 'creatives'),
          permission_id: getIdByName(permissions, 'delete_media'),
        },
        {
          role_id: getIdByName(roles, 'creatives'),
          permission_id: getIdByName(permissions, 'read_media_library'),
        },
        // Support Staff role permissions
        {
          role_id: getIdByName(roles, 'support_staff'),
          permission_id: getIdByName(permissions, 'read_reports'),
        },
        {
          role_id: getIdByName(roles, 'support_staff'),
          permission_id: getIdByName(permissions, 'read_campaigns'),
        },
        {
          role_id: getIdByName(roles, 'support_staff'),
          permission_id: getIdByName(permissions, 'read_adsets'),
        },
        {
          role_id: getIdByName(roles, 'support_staff'),
          permission_id: getIdByName(permissions, 'read_ads'),
        },
      ]);
    });
};
