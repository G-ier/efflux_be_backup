
const {
  fieldsFilter,
  FB_API_URL
} = require("../../constants/facebook");
const axios = require("axios");
const { findBy, update } = require('../common/models');
const { sendSlackNotification } = require('../../services/slackNotificationService');
const db = require('../../data/dbConfig');
const { getUserAccounts } = require("../../services/userAccountsService");

let meta_app_id = "1296811510855303" // the id of the app in facebook
let meta_business_id = "666218791274626" // the id of the business in facebook

let provider_id = "129446380142398" // id we store on the database
let unassigned_ad_account_id = "act_583331620511731"  // unassigned ad account id
let assigned_ad_account_id = "act_920802729340280" // assigned ad account id
let token = "EAADPDa6rZBb8BAM2uKNXyMANKFc1O8Lw0hVpU6tbFMq2lZCXmBqopZCCajCLR3czLNZA4Czz6Ev0tOZCqPnsx1BcbSGJXcVK2G69RLk6ixrx4kGmYUDFNf9vDoNB6cjwV8n6ly43IsU4yM2YYW8BhRKPU5flzm0WnpYKKNuvDlQZDZD"
let admin_provider_id = "10159474937571818"
let admin_token = "EAASbcXVx9ocBAAIS2HukVYXyEoI8cU18OWYjuG7u5LUS9gXtcDmPWYQafUXH92kFFMYDQHcUDPKw1K3vqHnWo9ggcA23NnwhGYmTEAxLmUjzS9adKMZB8OmHA0n1oIvTkwCoWJ9QnlrEupBNvVLZCTiNTkM4FRf48gveotuQZDZD"

async function debug_token(admin_token, access_token) {
  const url = `${FB_API_URL}debug_token?access_token=${admin_token}&input_token=${access_token}`;
  try {
    const response = await axios.get(url);
    const res = response.data.data;

    if (res.is_valid) {
      const provider_id = res.user_id;
      let username = await db.raw(`
        SELECT name FROM user_accounts WHERE provider_id = '${provider_id}';
      `)
      username = username.rows[0].name;
      const diffTime = Math.abs(new Date() - new Date(res.expires_at * 1000));
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      console.log("Token expires in", diffDays, "days");
      if (diffDays < 4) {
        console.log("Token is about to expire, please refresh it");
      }
      return [username, res.is_valid];
    } else {
      console.log("Token is not valid");
      return ['', false];
    }

  }
  catch (err) {
    console.info("ERROR GETTING OWNED AD ACCOUNTS", err.response?.data.error || err);
    return null;
  }
}

async function get_owned_ad_account(access_token, ad_account_id, business_id) {

  `
  Summary:
    Gets the accounts linked with a ad account
  Params:
    access_token: the access token of the user
    ad_account_id: the id of the ad account
    business_id: the id of the business in facebook
  Returns:
    data: a list of the facebook accounts linked to the ad account
  `

  const url = `${FB_API_URL}${ad_account_id}/assigned_users?access_token=${access_token}&business=${business_id}`;

  try {
    const response = await axios.get(url);
    return response.data.data;
  }
  catch (err) {
    console.info("ERROR GETTING OWNED AD ACCOUNTS", err.response?.data.error || err);
    return null;
  }
}

async function get_user_business_id(access_token, user_id, telemetry = false) {

  `
  Summary:
    Gets the business id of the user. Tries to find it in the database first,
    if it is not there, it gets it from the API and updates the database.
  Params:
    access_token: the access token of the user
    user_id: the id of the user in facebook
    telemetry: whether to print out the data or not
  Returns:
    business_id: the id of the business in facebook
  `

  const url = `${FB_API_URL}${user_id}/business_users?access_token=${access_token}`;

  try {
    // Check if business id is already in the database
    let data = await findBy('user_accounts', { provider_id: user_id });
    if (!data) {
      console.log("User not in the database.")
      return null;
    }

    let { id, business_scoped_id } = data;
    // // If it is, return it
    if (business_scoped_id !== ''){
      console.log("Business Scoped id already in the database.")
      return business_scoped_id;
    }

    // // If it is not, get it from the API and return it
    console.log("Business Scoped id not in the database. Getting it from the API.")
    const response = await axios.get(url);
    let juice_data = response.data.data;
    let filtered_data = juice_data.filter(data => data.business.name == 'ROI ADS LLC' )[0];

    if (telemetry) {
      console.log("Juice Data", juice_data);
      console.log("Filtered Data", filtered_data);
    }

    if (!filtered_data) {
      console.log("Business id not found in the API.")
      return null;
    }

    business_scoped_id = filtered_data.id;

    // Update the database with the business id
    console.log("Updating database with business id", business_scoped_id)
    await update("user_accounts", id, {business_scoped_id: business_scoped_id});
    return business_scoped_id;

  } catch (err) {
    console.info("ERROR GETTING USER BUSINESS ID", err.response?.data.error || err);
    return null;
  }
}

async function assign_ad_accounts(ad_account_id, access_token, business_scoped_user_id) {

  `
  Summary:
    Assigns the ad account to the user
  Params:
    ad_account_id: the id of the ad account
    access_token: the access token of the user
    business_scoped_user_id: the business scoped id of the user in facebook
  Returns:
    data: whether the ad account was assigned or not
  `

  const url = `${FB_API_URL}${ad_account_id}/assigned_users?access_token=${access_token}&user=${business_scoped_user_id}&tasks=['ADVERTISE', 'ANALYZE']`;

  try {
    const response = await axios.post(url);
    return response.data;
  } catch (err) {
    console.info("ERROR ASSIGNING FACEBOOK AD ACCOUNTS", err.response?.data.error || err);
    return null;
  }
}

async function get_bussines_users(meta_business_id, access_token) {
  const url = `${FB_API_URL}${meta_business_id}/business_users?access_token=${access_token}`;
  try {
    const response = await axios.get(url);
    console.log("Response", response.data.data)
    return response.data;
  } catch (err) {
    console.info("ERROR RETRIEVING BUSINESS USERS", err.response?.data.error || err);
    return null;
  }
}

async function invite_user_to_bussines(meta_business_id, access_token, email) {
  const url = `${FB_API_URL}${meta_business_id}/business_users?access_token=${access_token}&role=EMPLOYEE&email=${email}`;
  try {
    const response = await axios.post(url);
    console.log("Response", response.data)
    return response.data;
  } catch (err) {
    console.info("ERROR INVITING USER TO BUSINESS ACCOUNT", err.response?.data.error || err);
    return null;
  }
}

async function getAdAccounts(userId, token) {
  // TODO replace the hard-coded userid below with userId once we decide best way to handle that
  const url = `${FB_API_URL}${userId}/adaccounts?fields=${fieldsFilter}&access_token=${token}&limit=10000`;
  try {
    const response = await axios.get(url);
    console.log("Ad Accounts", response.data)
    return response.data.data;
  }
  catch (err) {
    console.info("ERROR GETTING AD ACCOUNTS", err.response?.data.error || err);
    return [];
  }
}

async function get_user_permissions(user_id, access_token) {
  const url = `${FB_API_URL}${user_id}/permissions?access_token=${access_token}`;
  try {
    const response = await axios.get(url);
    console.log("Permissions", response.data)
    return response.data;
  } catch (err) {
    console.info("ERROR RETRIEVING USER PERMISSIONS", err.response?.data.error || err);
    return null;
  }
}

async function assign__() {

  // const data = await get_owned_ad_account(admin_token, unassigned_ad_account_id, meta_business_id)
  // console.log("Data", data)

  // Get the business id of a user
  const business_id = await get_user_business_id(token, provider_id, true)
  console.log("Business ID", business_id)

  // // Assign the ad account to the user
  const assigned_data = await assign_ad_accounts(unassigned_ad_account_id, admin_token, business_id)
  console.log("Assigned data", assigned_data)

}

async function fbInsightPrototype() {

  //1 Get user accounts related to facebook.
  const accounts = await getUserAccounts('facebook');
  let accountValidity = {}

  // 2 Check if the accounts are valid
  for (const account of accounts) {
    let [username, isValid] = await debug_token(account.token, account.token)
    accountValidity[account.id] = isValid
  }

  // 3 If no accounts are valid, return
  if (Object.values(accountValidity).every(val => val !== true)) {
    console.log("Not all accounts are valid")
    return
  }

  // 4 Get the acount that will do the fetching
  const validAccount = accounts.filter(account => accountValidity[account.id] === true)[0]



}
// get_user_business_id(admin_token, provider_id, true)
// get_user_permissions(provider_id, token)
// getAdAccounts(provider_id, token)
// get_bussines_users(meta_business_id, admin_token)
// invite_user_to_bussines(meta_business_id, admin_token, "patrick@digittopia.com")
// debug_token(admin_token, admin_token)
fbInsightPrototype()
// assign__()
