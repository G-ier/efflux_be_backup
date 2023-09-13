const _ = require("lodash");
const {NotFound} = require('http-errors');
const db = require("../data/dbConfig");

const withNetworkFilter = (queryBuilder, networks) => {
  if (networks === "null") {
    queryBuilder.whereNull("network").orWhere({network: "unknown"});
  } else if (networks) {
    queryBuilder.whereIn("network", networks);
  }
};

const withProviderFilter = (queryBuilder, provider) => {
  if (provider) {
    queryBuilder.where("provider", provider);
  }
};

const withUserFilter = (queryBuilder, userId) => {
  if (userId) queryBuilder.where({user_id: userId});
};

async function getUserAdAccounts(userId, networks, provider) {
  const fields = ["id", "name", "status", "provider", "provider_id", "network", "tz_name"];

  const adAccounts = await db.select(
    ...fields,
    db("campaigns")
      .count("*")
      .whereRaw("?? = ??", ["campaigns.ad_account_id", "ad_accounts.id"])
      .as("campaignsCount"),
  )
    .from("ad_accounts")
    .orderBy("created_at", "desc")
    .modify(withNetworkFilter, networks)
    .modify(withProviderFilter, provider)
    .modify(withUserFilter, userId);

  return adAccounts;
}

async function getAdAccount(id) {
  const adAccount = await db.select({
    id: 'ad_accounts.id',
    provider_id: 'ad_accounts.provider_id',
    tz_name: 'ad_accounts.tz_name',
    tz_offset: 'ad_accounts.tz_offset',
    account_id: 'ad_accounts.account_id',
    user_token: 'user_accounts.token',
  })
    .table('ad_accounts')
    .leftJoin('user_accounts', 'ad_accounts.account_id', 'user_accounts.id')
    .where('ad_accounts.id', id)
    .first();
  if (!adAccount) throw new NotFound('ad_account');
  return adAccount;
}

async function getAccountAdAccounts(accountId) {
  const fields = ["id", "name", "status", "provider", "provider_id", "network", "tz_name", "tz_offset"];
  return db.select(...fields).from("ad_accounts").where({account_id: accountId})
}

async function update(filter, updateData) {
  const [updated] = await db("ad_accounts").where(filter).update(updateData).returning("name");
  return updated;
}

/**
 * Creates new, updated changed or skips adAccounts in database
 * @param account - db user account with joined ad_accounts
 * @param adAccounts - array of outbrain ad accounts
 * @returns {Promise<*[]>}
 */
async function updateAdAccounts(account, adAccounts) {

  const fields = [
    'id',
    'name',
    'provider',
    'provider_id',
    'status',
    'user_id',
    'account_id',
    'fb_account_id',
    'network',
    'amount_spent',
    'balance',
    'spend_cap',
    'currency',
    'tz_name',
    'tz_offset'
  ];

  const existingAdAccounts = await db.select(...fields).table('ad_accounts').where('account_id', account.id);
  const existingMap = _.keyBy(existingAdAccounts, "provider_id");

  const {updateArr = [], createArr = []} = _.groupBy(adAccounts, adAccount => {
    const existedAdAccount = existingMap[adAccount.provider_id];
    if (!existedAdAccount) return "createArr";
    if (existedAdAccount) {
      if (existedAdAccount.status !== adAccount.status ||
        existedAdAccount.name !== adAccount.name ||
        existedAdAccount.amount_spent !== adAccount.amount_spent ||
        existedAdAccount.balance !== adAccount.balance ||
        existedAdAccount.spend_cap !== adAccount.spend_cap ||
        existedAdAccount.currency !== adAccount.currency ||
        existedAdAccount.tz_name !== adAccount.tz_name ||
        existedAdAccount.fb_account_id !== adAccount.fb_account_id ||
        existedAdAccount.tz_offset !== adAccount.tz_offset
      ) return "updateArr";
    }
  });

  if (createArr.length) await db("ad_accounts").insert(createArr).returning(fields);


  if (updateArr.length) {
    await Promise.all(
      updateArr.map(item => db("ad_accounts")
        .where("provider_id", item.provider_id).first()
        .update({
          name: item.name,
          fb_account_id: item.fb_account_id,
          status: item.status,
          amount_spent: item.amount_spent,
          balance: item.balance,
          spend_cap: item.spend_cap,
          currency: item.currency,
          tz_name: item.tz_name,
          tz_offset: item.tz_offset,
        }).returning(fields))
    );
  }

  return db.select(...fields).table('ad_accounts').where('account_id', account.id)
}

async function updateUserAdAccountsTodaySpent(AdAccountsData){
  if (AdAccountsData.length) {
    await Promise.all(
      AdAccountsData.map(item => db("ad_accounts")
        .where("provider_id", item.account_id).first()
        .update({
          date_start: item.date_start,
          today_spent: item.spend
        }).returning('name'))
    );
  }
  return;
}
module.exports = {
  getUserAdAccounts,
  getAdAccount,
  getAccountAdAccounts,
  updateUserAdAccountsTodaySpent,
  update,
  updateAdAccounts
};
