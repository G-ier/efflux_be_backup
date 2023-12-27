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
        { name: 'manage_ad_accounts', description: 'Manages Ad Accounts' },
        { name: 'manage_users', description: 'Manages users in organization' },
        { name: 'manage_campaigns', description: 'Manages campaigns in organization' },
        { name: 'manage_reports', description: 'Manages performance reports in organization' },
        { name: 'manage_budgets', description: 'Manages budgets' },
        {
          name: 'manage_financial_planning',
          description: 'Manages forecasts and financial planning',
        },
        { name: 'read_reports', description: 'Reads assigned performance reports' },
        { name: 'read_media_library', description: 'Reads media library' },
        {
          name: 'manage_assigned_campaigns',
          description: 'Manages assigned campaigns (including budgets)',
        },
        { name: 'manage_own_account', description: 'Manages own account' },
        { name: 'manage_media_library', description: 'Manages organization’s media library' },
        { name: 'upload_media', description: 'Upload media assets' },
        { name: 'edit_media', description: 'Edit media assets' },
        { name: 'delete_media', description: 'Delete media assets' },
      ]);
    });
};
