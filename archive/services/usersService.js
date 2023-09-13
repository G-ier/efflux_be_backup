const db = require('../data/dbConfig');

async function get(isAdmin) {
  let accountsFields = {
    ad_account_id: 'ad_accounts.id',
    ad_account_name: 'ad_accounts.name',
    ad_account_provider: 'ad_accounts.provider',
  };
  const withAccountsData = (queryBuilder, isAdmin) => {
    if (isAdmin) queryBuilder
      .leftJoin('ad_accounts', 'users.id', 'ad_accounts.user_id');
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
