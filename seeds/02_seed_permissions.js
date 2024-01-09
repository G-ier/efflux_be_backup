/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  return knex('permissions')
    .del()
    .then(function () {
      // Inserts seed entries
      return knex('permissions').insert([
        // Campaigns permissions
        { name: 'create_campaigns', description: 'Creates campaigns in organization' },
        { name: 'edit_campaigns', description: 'Edits campaigns in organization' },
        { name: 'delete_campaigns', description: 'Deletes campaigns in organization' },
        { name: 'read_campaigns', description: 'Reads assigned campaigns' },
        { name: 'start_campaigns', description: 'Starts campaigns in organization' },
        { name: 'stop_campaigns', description: 'Stops campaigns in organization' },
        { name: 'assign_campaigns', description: 'Assigns campaigns to users in the organization' },

        // Pixels permissions
        { name: 'create_pixels', description: 'Creates pixels in organization' },
        { name: 'edit_pixels', description: 'Edits pixels in organization' },
        { name: 'delete_pixels', description: 'Deletes pixels in organization' },
        { name: 'read_pixels', description: 'Reads assigned pixels' },

        // Adsets permissions
        { name: 'create_adsets', description: 'Creates adsets in organization' },
        { name: 'edit_adsets', description: 'Edits adsets in organization' },
        { name: 'delete_adsets', description: 'Deletes adsets in organization' },
        { name: 'read_adsets', description: 'Reads assigned adsets' },

        // Ads permissions
        { name: 'create_ads', description: 'Creates ads in organization' },
        { name: 'read_ads', description: 'Reads assigned ads' },
        { name: 'edit_ads', description: 'Edits ads in organization' },
        { name: 'delete_ads', description: 'Deletes ads in organization' },
        { name: 'launch_ads', description: 'Launches ads in organization' },

        // Media Library permissions
        { name: 'upload_media', description: 'Upload media assets' },
        { name: 'edit_media', description: 'Edit media assets' },
        { name: 'delete_media', description: 'Delete media assets' },

        // Reports permissions
        { name: 'manage_reports', description: 'Manages performance reports in organization' },
        { name: 'read_reports', description: 'Reads assigned performance reports' },
        { name: 'download_reports', description: 'Downloads performance reports' },

        // Ad Accounts permissions
        { name: 'manage_ad_accounts', description: 'Manages Ad Accounts in organization' },
        { name: 'read_ad_accounts', description: 'Reads assigned Ad Accounts' },

        // Users permissions
        { name: 'invite_users', description: 'Invites users to the organization' },
        { name: 'read_users', description: 'Reads users in the organization' },
        { name: 'delete_users', description: 'Deletes users from the organization' },

        // Organizations permissions
        { name: 'edit_organization', description: 'Edits organization' },
        { name: 'read_organization', description: 'Reads organization' },
      ]);
    });
};
