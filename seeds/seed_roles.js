/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function (knex) {
  // Deletes ALL existing entries
  return knex('roles')
    .del()
    .then(function () {
      // Inserts seed entries
      return knex('roles').insert([
        { name: 'admin', description: 'admin', is_active: true },
        { name: 'media buyer', description: 'media buyer', is_active: true },
        { name: 'creative', description: 'creative', is_active: true },
        { name: 'support staff', description: 'support staff', is_active: true },
        { name: 'manager', description: 'manager', is_active: false },
        { name: 'publisher', description: 'publisher', is_active: false },
        { name: 'advertiser', description: 'advertiser', is_active: false },
        { name: 'affiliate', description: 'affiliate', is_active: false },
      ]);
    });
};
