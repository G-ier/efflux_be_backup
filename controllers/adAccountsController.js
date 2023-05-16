const {BadRequest} = require('http-errors');
const adAccountsService = require('../services/adAccountsService');
const campaignsService = require('../services/campaignsService');
const {getAdAccount} = require('../services/facebookService');
const usersService = require('../services/usersService');
const {crossroads, system1} = require('../constants/networks');
const ErrorMessages = require('../constants/errorMessages')

async function getAdAccounts(authUser, networks) {
  const {isAdmin, providerId} = authUser;
  let userId;
  if (!isAdmin) {
    console.log("Auth User is not admin")
    // Get the user making the request if he is not admin
    const user = await usersService.getSingle({providerId}, ['id'])
    userId = user.id;
  }

  console.log("User ID", userId)
  console.log("Networks", networks)

  // Find the ad accounts belonging to the user and return them.
  let ad_accounts = await adAccountsService.getUserAdAccounts(userId, networks);
  console.log("Ad Accounts No:", ad_accounts.length)
  return ad_accounts
}

async function updateAdAccount(authUser, filter, updateData) {
  const {isAdmin, providerId} = authUser;

  // If the user is not admin filter by the user making the request
  if (!isAdmin) {
    console.log("Auth User is not admin")
    const user = await usersService.getSingle({providerId}, ['id'])
    filter.user_id = user.id;
  }

  // If we're assigning a ad_account to the admin user, change the user_id to the admin user id
  if (updateData.user_id === 'admin') {
    console.log("Update Data User ID is admin")
    const user = await usersService.getSingle({nickname: 'admin'}, ['id'])
    updateData.user_id = user.id;
  // If we're assigning a ad_account to a user, change the user_id to the user id
  } else if (updateData.user_id) {
    console.log("Update Data User ID is not admin")
    updateData.user_id = parseInt(updateData.user_id, 10);
  }

  console.log("Filter", filter)
  console.log("updateData", updateData)

  // NOTE: prevent assign ad_account with network if tz don't match

  // const existingAdAccount = await adAccountsService.getAdAccount(filter.id);
  // const {timezone_name, timezone_offset_hours_utc} = await getAdAccount(existingAdAccount.provider_id, existingAdAccount.user_token);
  //
  // if(existingAdAccount.tz_name !== timezone_name || existingAdAccount.tz_offset !== timezone_offset_hours_utc) {
  //   await adAccountsService.update({id: existingAdAccount.id}, {tz_name: timezone_name, tz_offset: timezone_offset_hours_utc});
  // }

  // if (updateData.network === crossroads.name && timezone_name !== crossroads.tz_name ||
  //   updateData.network === system1.name && timezone_name !== system1.tz_name) {
  //   throw new BadRequest(ErrorMessages.invalid_ad_account_time_zone);
  // }

  const updated = await adAccountsService.update(filter, updateData);
  const count = await campaignsService.update({ad_account_id: filter.id}, updateData);
  return {
    count,
    name: updated
  }
}

module.exports = {
  getAdAccounts,
  updateAdAccount,
};
