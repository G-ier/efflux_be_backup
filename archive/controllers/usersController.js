const _ = require('lodash');
const usersService = require('../services/usersService');

async function getUsers(isAdmin) {
  let users = await usersService.get(isAdmin);

  if (isAdmin) {
    users = _(users)
      .groupBy('id')
      .mapValues((items) => {
        const {id, name, nickname, account_id, ad_account_id} = items[0];
        const accounts = account_id
          ? _(items).map((item) => ({
            id: item.account_id,
            name: item.account_name,
            email: item.account_email,
            provider: item.account_provider,
          })).uniqBy('id').value() : [];
        const ad_accounts = ad_account_id
          ? items.map((item) => ({
            id: item.ad_account_id,
            name: item.ad_account_name,
            provider: item.ad_account_provider,
          }))
          : [];

        return {id, name, nickname, accounts, ad_accounts};
      }).map();
  }
  return users;
}

module.exports = {
  getUsers
};
