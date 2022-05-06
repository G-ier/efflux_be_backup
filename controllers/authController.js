const models = require("../common/helpers");
const db = require("../data/dbConfig");
const {
  getAuth0User,
  getUserIdentity,
  getGoogleTokens,
  getFacebookLongToken,
  getGoogleAccount,
  revokeFacebookToken,
  revokeGoogleToken
} = require("../services/oauthService");
const redis = require("../services/redisService");
const userService = require("../services/usersService");
const outbrainService = require("../services/outbrainService");

/**
 * @name addOauthAccount
 * @desc Add new oAuth account
 * @param {Object} auth0user
 * @param {Object} account_details
 * @returns {Promise<Object>}
 */
async function addFacebookAccount(auth0user, account_details) {
  const [auth0, providerId] = auth0user.sub.split("|");
  const { id: user_id } = await db("users").where({ provider: "auth0", providerId }).first();

  const { name, email, provider, providerId: provider_id, imageUrl: image_url, accessToken } = account_details;

  const exists = await db("user_accounts").where({ provider, provider_id }).first();

  if (exists) {
    return { account: exists, created: false };
  }

  const [account_id] = await models.add("user_accounts", {
    name,
    email,
    provider,
    provider_id,
    image_url,
    status: "active",
    user_id,
  });

  const token = await getFacebookLongToken(accessToken);
  await db("user_accounts").where({ id: account_id }).update({ token });

  const account = await db("user_accounts").where({ id: account_id }).first();
  return { account, created: true };
}

/**
 * @name login
 * @desc Logs in user from auth0
 * @param {Object} user
 * @param {Object} account
 * @returns {Promise<Object>}
 */
async function login(user, account) {
  const { name, email, image_url, nickname, sub } = account;

  // TODO: Support an array type for more and more permissions in the future.
  // We're just going to handle these 2
  const acct_type = user.permissions.includes("admin")
    ? "admin"
    : "media_buyer";

  const userFromAuth0 = await getAuth0User(sub);
  const identity = getUserIdentity(userFromAuth0);

  let user_res = await db("users").where(identity).first();

  if (!user_res) {
    [user_res] = await db("users").insert({
      name,
      nickname,
      email,
      image_url,
      sub,
      acct_type,
      ...identity
    }, ["id", "acct_type"]);
  }

  if (user_res && user_res.acct_type !== acct_type) {
    await models.update("users", user_res.id, {
      acct_type,
    });
  }

  // get access_token from Auth0 management API
  return { id: user_res.id, ...userFromAuth0 };
}

async function addGoogleAccount(auth0user, code) {
  const [auth0, providerId] = auth0user.sub.split("|");
  const { id: user_id } = await db("users").where({ provider: "auth0", providerId }).first();

  const { access_token, refresh_token } = await getGoogleTokens(code);
  const { name, email, picture: image_url, id } = await getGoogleAccount(access_token);

  const identity = {
    provider: "google",
    provider_id: id,
    user_id,
  };

  const user = await db("user_accounts").where(identity).first();

  if (user) {
    return { account: user, created: false };
  }

  const account = await models.add("user_accounts", {
    name,
    email,
    image_url,
    status: "active",
    token: refresh_token,
    ...identity,
  });

  return { account, created: true };
}

async function addOutbrainAccount(auth0user, userObj) {
  const [auth0, providerId] = auth0user.sub.split("|");
  const { id: user_id } = await userService.getSingle({ providerId }, ["id"]);

  const { login, password } = userObj;
  const auth = Buffer.from(`${login}:${password}`).toString("base64");

  const identity = {
    user_id,
    token: auth,
    provider: "outbrain",
  };

  const existedAccount = await db("user_accounts").where(identity).first();
  if (existedAccount) return { account: existedAccount, created: false };

  const { token, user } = await outbrainService.login(auth);
  if (!token) return { account: null, created: false };

  const account = await models.add("user_accounts", {
    name: user.userName,
    email: user.userName,
    provider_id: user.userId,
    status: "active",
    ...identity,
  });

  await redis.set(`OB_TOKEN_${user.userId}`, token);

  return { account, created: true };
}

/**
 * @name reauthorizeFacebook
 * @desc reauthorize already exists account
 * @param {Object} auth0user
 * @param {number} accountId
 * @param {Object} account_details
 * @returns {Promise<String>}
 */
async function reauthorizeFacebook(auth0user, accountId, account_details) {
  const { name, accessToken, providerId: provider_id, imageUrl: image_url } = account_details;
  const foundAccount = await db("user_accounts").where("id", accountId).first();

  if (foundAccount.provider_id !== provider_id) throw new Error("Reauthorize under another account is forbidden");

  const token = await getFacebookLongToken(accessToken);
  const [account] = await db("user_accounts").where({ id: accountId, provider_id }).first().update({
    name,
    image_url,
    token
  }).returning(["name"]);
  return account;
}

/**
 * @name reauthorizeGoogle
 * @desc reauthorize already exists account
 * @param {Object} auth0user
 * @param {number} accountId
 * @param {number} code
 * @returns {Promise<String>}
 */
async function reauthorizeGoogle(auth0user, accountId, code) {
  const foundAccount = await db("user_accounts").where("id", accountId).first();

  const { access_token, refresh_token } = await getGoogleTokens(code);
  const { name, id, picture: image_url } = await getGoogleAccount(access_token);

  if (foundAccount.provider_id !== id) throw new Error("Reauthorize under another account is forbidden");

  const identity = {
    provider: "google",
    provider_id: id,
    id: accountId
  };

  const [account] = await db("user_accounts").where(identity).first().update({
    name,
    image_url,
    token: refresh_token
  }).returning(["name"]);
  return account;
}

/**
 * @name deleteAccount
 * @desc delete user account
 * @param {number} accountId
 */
async function deleteAccount(accountId) {
  const account = await db("user_accounts").where("id", accountId).first();
  switch (account.provider) {
    case "facebook":
      await revokeFacebookToken(account.token, account.provider_id);
      break;
    case "google":
      await revokeGoogleToken(account.token);
      await redis.del(`GOOGLE_ACCESS_TOKEN_${account.provider_id}`);
      break;
  }
  await db("campaigns").where("account_id", account.id).del();
  await db("ad_accounts").where("account_id", account.id).del();
  const count = await db("user_accounts").where("id", account.id).del();
  return count;
}

module.exports = {
  login,
  addFacebookAccount,
  addGoogleAccount,
  addOutbrainAccount,
  reauthorizeFacebook,
  reauthorizeGoogle,
  deleteAccount
};
