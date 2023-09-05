const db = require("../../../data/dbConfig");
const { sendSlackNotification } = require("../../../services/slackNotificationService");
const _ = require("lodash");
const { FB_API_URL, availableStatuses } = require("./constants");
const axios = require("axios");

async function debugToken(admin_token, access_token) {
  const url = `${FB_API_URL}debug_token?access_token=${admin_token}&input_token=${access_token}`;
  let res = null;
  try {
    const response = await axios.get(url);
    res = response.data?.data;
  } catch (err) {
    console.info("ERROR GETTING OWNED AD ACCOUNTS", err.response?.data.error || err);
    return ["", false];
  }

  if (res.is_valid) {
    const diffTime = Math.abs(new Date() - new Date(res.expires_at * 1000));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    console.log("Token expires in", diffDays, "days");

    const provider_id = res.user_id;
    let username = await db.raw(`
        SELECT name FROM user_accounts WHERE provider_id = '${provider_id}';
      `);

    username = username.rows[0].name;

    if (diffDays < 4) {
      if (sent < max_sent) {
        await sendSlackNotification(
          `Facebook API Token of user ${username} is about to expire in ${diffDays} days, please refresh it.`,
        );
        sent++;
      }
    }
    return [username, res.is_valid];
  } else {
    console.log("Token is not valid");
    return ["", false];
  }
}

async function getUserAccounts(provider) {
  const userAccounts = await db
    .select({
      id: "user_accounts.id",
      email: "user_accounts.email",
      provider_id: "user_accounts.provider_id",
      token: "user_accounts.token",
      user_id: "user_accounts.user_id",
      ad_account_id: "ad_accounts.id",
      ad_account_pid: "ad_accounts.provider_id",
      ad_account_name: "ad_accounts.name",
      ad_account_network: "ad_accounts.network",
    })
    .table("user_accounts")
    .leftJoin("ad_accounts", "user_accounts.id", "ad_accounts.account_id")
    .where("user_accounts.provider", provider)
    .whereIn("user_accounts.id", [20, 28, 30, 31])
    .andWhereNot({ token: null })
    .orderBy("user_accounts.id");

  return _(userAccounts)
    .groupBy("id")
    .mapValues((items) => {
      const { id, email, provider_id, token, user_id } = items[0];
      return {
        id,
        email,
        provider_id,
        token,
        user_id,
        ad_accounts: _(items)
          .filter("ad_account_id")
          .map(({ ad_account_id, ad_account_pid, ad_account_name, ad_account_network }) => ({
            id: ad_account_id,
            provider_id: ad_account_pid,
            name: ad_account_name,
            network: ad_account_network,
          }))
          .value(),
      };
    })
    .map()
    .value();
}

async function pickFetchingAccount() {
  const accounts = await getUserAccounts("facebook");

  let accountValidity = {};

  // 2 Check if the accounts are valid
  for (const account of accounts) {
    let [username, isValid] = await debugToken(account.token, account.token);

    accountValidity[account.id] = isValid;
  }

  // 3 If no accounts are valid, return
  if (Object.values(accountValidity).every((val) => val !== true)) {
    console.log(`Facebook Insight Fetching: All accounts are invalid`);
    return;
  }

  // 4 Get the acount that will do the fetching
  const account = accounts.filter((account) => accountValidity[account.id] === true)[0];

  return account;
}

function validateInput({ type, token, status }) {
  if (!type || (type !== "adset" && type !== "campaign")) {
    throw Error("Type must be either 'adset' or 'campaign'.");
  }
  if (!token) {
    throw Error("Token is required.");
  }
  if (status && !availableStatuses.includes(status)) {
    throw Error("Status is not valid.");
  }
}

module.exports = { pickFetchingAccount, validateInput };
