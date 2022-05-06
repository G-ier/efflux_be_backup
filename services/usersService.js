const db = require('../data/dbConfig');

async function get(isAdmin) {
  let accountsFields = {
    account_id: 'user_accounts.id',
    account_email: 'user_accounts.email',
    account_name: 'user_accounts.name',
    account_provider: 'user_accounts.provider',
    ad_account_id: 'ad_accounts.id',
    ad_account_name: 'ad_accounts.name',
    ad_account_provider: 'ad_accounts.provider',
  };
  const withAccountsData = (queryBuilder, isAdmin) => {
    if (isAdmin) queryBuilder
      .leftJoin('user_accounts', 'users.id', 'user_accounts.user_id')
      .leftJoin('ad_accounts', 'user_accounts.id', 'ad_accounts.account_id');
  };

  const users = await db.select({
    id: 'users.id',
    name: 'users.name',
    nickname: 'users.nickname',
    ...(isAdmin ? accountsFields : {})
  })
    .where('users.token', null)
    .table('users')
    .modify(withAccountsData, isAdmin);

  return users;
}

async function getSingle(filter, fields = ['*']) {
  const user = await db.select(...fields).from('users').where(filter).first();
  return user
}

module.exports = {
  get,
  getSingle
};
