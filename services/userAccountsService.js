const db = require('../data/dbConfig');
const _ = require('lodash');

async function getUserAccounts(provider) {
  const userAccounts = await db.select({
    id: 'user_accounts.id',
    email: 'user_accounts.email',
    provider_id: 'user_accounts.provider_id',
    token: 'user_accounts.token',
    user_id: 'user_accounts.user_id',
    ad_account_id: 'ad_accounts.id',
    ad_account_pid: 'ad_accounts.provider_id',
    ad_account_name: 'ad_accounts.name',
    ad_account_network: 'ad_accounts.network',
  })
    .table('user_accounts')
    .leftJoin('ad_accounts', 'user_accounts.id', 'ad_accounts.account_id')
    .where('user_accounts.provider', provider)
    .where('user_accounts.id', 20)
    .andWhereNot({token: null});

  return _(userAccounts)
  .groupBy('id')
  .mapValues((items) => {
    const {id, email, provider_id, token, user_id} = items[0];
    return {
      id,
      email,
      provider_id,
      token,
      user_id,
      ad_accounts: _(items)
        .filter('ad_account_id')
        .map(({ad_account_id, ad_account_pid, ad_account_name, ad_account_network}) => ({
          id: ad_account_id,
          provider_id: ad_account_pid,
          name: ad_account_name,
          network: ad_account_network
        }))
        .value()
    };
  })
  .map()
  .value();
}

module.exports = {
  getUserAccounts
}
