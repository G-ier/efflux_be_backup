// Third party imports
const _ = require('lodash');
const assert = require('assert');
const axios = require('axios');

// Local imports
const UserRepository = require('../auth/repositories/UserRepository');
const UserAccountRepository = require('../facebook/repositories/UserAccountRepository');
const AdAccountRepository = require('../facebook/repositories/AdAccountRepository');
const AdsetsRepository = require('../facebook/repositories/AdsetsRepository');
const CampaignRepository = require('../facebook/repositories/CampaignRepository');
const NetworkCampaignsRepository = require('../crossroads/repositories/CampaignRepository');
const DatabaseConnection = require('../../shared/lib/DatabaseConnection');
const EnvironmentVariablesManager = require('../../shared/services/EnvironmentVariablesManager');
const PixelsService = require('../facebook/services/PixelsService');
const {FELogger} = require('../../shared/lib/WinstonLogger');
const { todayYMD } = require('../../shared/helpers/calendar');

class TemporaryService {

  constructor() {
    this.adAccountRepository = new AdAccountRepository();
    this.userRepository = new UserRepository();
    this.adsetsRepository = new AdsetsRepository();
    this.campaignRepository = new CampaignRepository();
    this.networkCampaignsRepository = new NetworkCampaignsRepository();
    this.UserAccountRepository = new UserAccountRepository();
    this.pixelService = new PixelsService;
    this.fe_logger = FELogger;
  }

  // Use static method to get the connection where needed
  get database() {
    return DatabaseConnection.getReadWriteConnection();
  }

  async fetchLinkGenerationUsageData() {
    const today = todayYMD();
    const query = `
      WITH spend_data AS (
        SELECT
          ad_id,
          SUM(CASE
            WHEN DATE(occurred_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles') = CURRENT_DATE
            THEN spend
            ELSE 0
          END) AS today_spend,
          SUM(spend) AS total_spend
        FROM
          spend
        WHERE
          DATE(occurred_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Los_Angeles')
          BETWEEN (DATE '${today}' - INTERVAL '1 day') AND '${today}'
        GROUP BY
          ad_id
      ),
      active_ads AS (
        SELECT
          ads.id AS ad_id,
          ads.traffic_source,
          ads.ad_account_id,
          ads.campaign_id,
          ads.adset_id,
          adlinks.raw_ad_link,
          CASE WHEN adlinks.raw_ad_link LIKE '%houston%' THEN 1 ELSE 0 END AS has_houston,
          COALESCE(spend_data.today_spend, 0) AS today_spend,
          COALESCE(spend_data.total_spend, 0) AS total_spend
        FROM
          ads
        INNER JOIN
          adlinks ON ads.creative_id = adlinks.id
        LEFT JOIN
          spend_data ON ads.id = spend_data.ad_id
        WHERE
          ads.status = 'ACTIVE'
      ),
      traffic_source_stats AS (
        SELECT
          traffic_source,
          COUNT(*) AS total_active_ads,
          SUM(CASE WHEN total_spend > 0 THEN 1 ELSE 0 END) AS ads_with_spend,
          SUM(CASE WHEN total_spend = 0 THEN 1 ELSE 0 END) AS ads_without_spend,
          SUM(has_houston) AS ads_with_houston,
          SUM(CASE WHEN has_houston = 0 THEN 1 ELSE 0 END) AS ads_without_houston,
          SUM(CASE WHEN total_spend > 0 AND has_houston = 1 THEN 1 ELSE 0 END) AS ads_with_spend_with_houston,
          SUM(CASE WHEN total_spend > 0 AND has_houston = 0 THEN 1 ELSE 0 END) AS ads_with_spend_without_houston,
          SUM(CASE WHEN has_houston = 1 THEN today_spend ELSE 0 END) AS spend_with_houston,
          SUM(CASE WHEN has_houston = 0 THEN today_spend ELSE 0 END) AS spend_without_houston,
          SUM(today_spend) AS today_total_spend
        FROM
          active_ads
        GROUP BY
          traffic_source
      )
      SELECT
        traffic_source,
        COALESCE(total_active_ads, 0) AS total_active_ads,
        COALESCE(ads_with_spend, 0) AS ads_with_spend,
        COALESCE(ads_without_spend, 0) AS ads_without_spend,
        COALESCE(ads_with_houston, 0) AS ads_with_houston,
        COALESCE(ads_without_houston, 0) AS ads_without_houston,
        COALESCE(ads_with_spend_with_houston, 0) AS ads_with_spend_with_houston,
        COALESCE(ads_with_spend_without_houston, 0) AS ads_with_spend_without_houston,
        COALESCE(spend_with_houston, 0) AS spend_with_houston,
        COALESCE(spend_without_houston, 0) AS spend_without_houston,
        COALESCE(today_total_spend, 0) AS total_spend,
        COALESCE(ROUND(100.0 * ads_with_spend / NULLIF(total_active_ads, 0), 2), 0) AS percent_ads_with_spend,
        COALESCE(ROUND(100.0 * ads_without_spend / NULLIF(total_active_ads, 0), 2), 0) AS percent_ads_without_spend,
        COALESCE(ROUND(100.0 * ads_with_houston / NULLIF(total_active_ads, 0), 2), 0) AS percent_ads_with_houston,
        COALESCE(ROUND(100.0 * ads_without_houston / NULLIF(total_active_ads, 0), 2), 0) AS percent_ads_without_houston,
        COALESCE(ROUND(100.0 * ads_with_spend_with_houston / NULLIF(ads_with_spend, 0), 2), 0) AS percent_ads_with_spend_with_houston,
        COALESCE(ROUND(100.0 * ads_with_spend_without_houston / NULLIF(ads_with_spend, 0), 2), 0) AS percent_ads_with_spend_without_houston,
        COALESCE(ROUND(100.0 * spend_with_houston / NULLIF(today_total_spend, 0), 2), 0) AS percent_spend_with_houston,
        COALESCE(ROUND(100.0 * spend_without_houston / NULLIF(today_total_spend, 0), 2), 0) AS percent_spend_without_houston
      FROM
        traffic_source_stats
      WHERE
        traffic_source IN ('tiktok', 'facebook')
      ORDER BY
        traffic_source;

    `

    const reports = await this.database.raw(query);
    return reports.rows;
  }

  async fetchOperationalErrors(fields = ['*'], filters = {}, limit) {
    const errors = await this.UserAccountRepository.database.query("operational_errors", fields, filters, limit);
    return errors;
  }

  async fetchEffluxErrors(fields = ['*'], filters = {}, limit, joins = [], cache = false, orderBy = [{column: 'efflux_errors.date', direction: 'desc'}]) {
    const errors = await this.UserAccountRepository.database.query(
      "efflux_errors",
      fields,
      filters,
      limit,
      joins,
      cache,
      orderBy
    );
    return errors;
  }

  async changeOperationalErrorStatus(id, type, traffic_source, resolved) {
    await this.UserAccountRepository.database.update("operational_errors", { resolved: resolved },{ id: id, type: type, traffic_source: traffic_source });
  }

  async changeEffluxErrorStatus(id, resolved) {
    console.log("changeEffluxErrorStatus", id, resolved);
    await this.UserAccountRepository.database.update("efflux_errors", { resolved: resolved }, { id: id });
  }

  // AD ACCOUNTS
  async fetchAdAccountsFromDatabase(fields = ['*'], filters = {}, limit, joins = []) {
    const results = await this.adAccountRepository.fetchAdAccounts(fields, filters, limit, joins);
    return results;
  }

  async unassignAdAccountFromUser(aa_id, u_id) {
    const response = await this.database('u_aa_map').where({ aa_id, u_id }).del();
    return response;
  }

  async assignAdAccountToUser(adAccountId, userId) {
    const uCount = await this.adAccountRepository.upsertUserAssociation([adAccountId], userId);
    return uCount !== 0;
  }
  //  --------------------------------------------

  // NETWORK CAMPAIGNS
  async fetchNetworkCampaignsFromDatabase(fields = ['*'], filters = {}, limit, joins = []) {
    const results = await this.networkCampaignsRepository.fetchCampaigns(fields, filters, limit, joins);
    return results;
  }

  async unassignNetworkCampaignFromUser(networkCampaignId, userId) {
    const response = await this.database('network_campaigns_user_relations').where({ network_campaign_id: networkCampaignId, user_id: userId }).del();
    return response;
  }

  async assignNetworkCampaignToUser(network, networkCampaignId, userId) {
    const results = await this.networkCampaignsRepository.upsertUserAssociation(network, networkCampaignId, userId);
    return results;
  }
  //  --------------------------------------------

  // USER RELATIONS
  async fetchUsersWithRelations(userId, isAdmin) {
    let userFilters = {};
    if (!isAdmin) userFilters = { id: userId };
    let users = await this.userRepository.database.raw(
      `
      -- Subquery to aggregate ad accounts
      WITH ad_accounts_agg AS (
          SELECT
              map.u_id AS user_id,
              ARRAY_AGG(DISTINCT map.aa_id) AS ad_accounts
          FROM
              u_aa_map map
          GROUP BY
              map.u_id
      ),

      -- Subquery to aggregate network campaigns
      network_campaigns_agg AS (
          SELECT
              nwcr.user_id,
              ARRAY_AGG(
                  DISTINCT jsonb_build_object(
                      'id', nwcr.network_campaign_id,
                      'name', network_campaigns.name,
                      'source', nwcr.source
                  )
              ) AS network_campaigns
          FROM
              network_campaigns_user_relations nwcr
          INNER JOIN
              network_campaigns ON nwcr.network_campaign_id = network_campaigns.id
          GROUP BY
              nwcr.user_id
      )

      -- Main query to join users with aggregated data
      SELECT
          u.id,
          u.name,
          COALESCE(aa.ad_accounts, ARRAY[]::INTEGER[]) AS ad_accounts,
          COALESCE(nc.network_campaigns, ARRAY[]::JSONB[]) AS network_campaigns
      FROM
          users u
      LEFT JOIN
          ad_accounts_agg aa ON u.id = aa.user_id
      LEFT JOIN
          network_campaigns_agg nc ON u.id = nc.user_id;
      `
    );

    return users.rows;
  }
  // --------------------------------------------

  async fetchUsersWithAdAccountsForNewEfflux(userId, businessId=null, isAdmin, ts="fb") {

    if(ts == "tt"){
      this.pixelService.pixelRepository.tableName = "tt_pixels";
      if(!businessId){
        let userFilters = {};
        if (!isAdmin) userFilters = { id: userId };
        let users = await this.userRepository.fetchUsers(['*'], userFilters);
        const userIds = users.map((user) => user.id);

        // Fetch ad_account ids of backup user accounts and exclude them from the ad accounts query.
        let whereClause = {};
        if (!isAdmin) whereClause['map.u_id'] = userIds;

        const adAccounts = await this.adAccountRepository.fetchAdAccounts(
          [
            '*',
            'map.u_id AS user_id',
          ],
          whereClause,
          false,
          [
            {
              type: 'inner',
              table: 'u_aa_map AS map',
              first: `ad_accounts.id`,
              operator: '=',
              second: 'map.aa_id',
            },
          ],
        );

        // Logic for adding data for each ad account -----------------------------------------





        // Grab pixel data and inject it

        //await this.pixelService.syncPixels(users[0].token, adAccounts, "today");

        let whereClause2 = {};
        const pixels = this.pixelService.fetchPixelsFromDatabase(
          [
            'tt_pixels.id',
            'tt_pixels.name',
            'tt_pixels.ad_account_id'
          ],
        );

        console.log(`
        ------------------------------
          AD ACCOUNT
          ${JSON.stringify(adAccounts)}
        ------------------------------
        `);

        adAccounts.forEach(adacc => {
          adacc.pixels = [];
          for(const pix in pixels){
            if(pix.ad_account_id == adacc.id){
              adacc.pixels.push(pix);
            }
          }
        });




        // Logic ends here -------------------------------------------------------------------

        users = users.map((user) => {
          user.ad_accounts = adAccounts.filter((adAccount) => adAccount.user_id === user.id);
          return user;
        });

        return users;
      } else {

        let accountFilters = {business_id: businessId};
        let accounts = await this.UserAccountRepository.fetchUserAccounts(['*'], accountFilters);
        const userIds = accounts.map((account) => account.user_id);

        // Fetch users based on user_id
        let users = [];
        userIds.forEach(async user => {
          let userFilters = {id: user};

          const luxus = await this.userRepository.fetchUsers(['*'], userFilters);

          luxus.forEach(single => {
            users.push(single);
          })


        });


        const otherUserIds = users.map((user) => user.id);


        // Fetch ad_account ids of backup user accounts and exclude them from the ad accounts query.
        let whereClause = {};
        if (!isAdmin) whereClause['map.u_id'] = otherUserIds;

        const adAccounts = await this.adAccountRepository.fetchAdAccounts(
          [
            '*',
            'map.u_id AS user_id',
          ],
          whereClause,
          false,
          [
            {
              type: 'inner',
              table: 'u_aa_map AS map',
              first: `ad_accounts.id`,
              operator: '=',
              second: 'map.aa_id',
            },
          ],
        );

        // Logic for adding data for each ad account -----------------------------------------


        // Grab pixel data and inject it

        //await this.pixelService.syncPixels(users[0].token, adAccounts, "today");

        let whereClause2 = {};
        let pixels = await this.pixelService.fetchPixelsFromDatabase(
          [
            'tt_pixels.id',
            'tt_pixels.name',
            'tt_pixels.ad_account_id'
          ],

        );




        adAccounts.forEach(adacc => {
          adacc.pixels = [];


          pixels.forEach(pix => {

            if(pix.ad_account_id == adacc.id){

              console.log(pix.ad_account_id);
              adacc.pixels.push(pix);
            }
          });
          if(adacc.pixels.length > 0){
            console.log(`
            --------------------------------

              CORRECT RESULT
              ${adacc.id}
              ${JSON.stringify(adacc.pixels)}

            --------------------------------
            `);
          }


        });




        // Logic ends here -------------------------------------------------------------------

        users = users.map((user) => {
          user.ad_accounts = adAccounts.filter((adAccount) => adAccount.user_id === user.id);
          return user;
        });




        return users;
      }
    }

    // this is case where ts=="fb"
    if(!businessId){
      let userFilters = {};
      if (!isAdmin) userFilters = { id: userId };
      let users = await this.userRepository.fetchUsers(['*'], userFilters);
      const userIds = users.map((user) => user.id);

      // Fetch ad_account ids of backup user accounts and exclude them from the ad accounts query.
      let whereClause = {};
      if (!isAdmin) whereClause['map.u_id'] = userIds;

      const adAccounts = await this.adAccountRepository.fetchAdAccounts(
        [
          '*',
          'map.u_id AS user_id',
        ],
        whereClause,
        false,
        [
          {
            type: 'inner',
            table: 'u_aa_map AS map',
            first: `ad_accounts.id`,
            operator: '=',
            second: 'map.aa_id',
          },
        ],
      );

      // Logic for adding data for each ad account -----------------------------------------





      // Grab pixel data and inject it

      //await this.pixelService.syncPixels(users[0].token, adAccounts, "today");

      let whereClause2 = {};
      const pixels = this.pixelService.fetchPixelsFromDatabase(
        ['*'],
        whereClause2,
        false,
        [],
      );

      console.log(`
      ------------------------------
        AD ACCOUNT
        ${JSON.stringify(adAccounts)}
      ------------------------------
      `);

      adAccounts.forEach(adacc => {
        adacc.pixels = [];
        for(const pix in pixels){
          if(pix.ad_account_id == adacc.id){
            adacc.pixels.push(pix);
          }
        }
      });




      // Logic ends here -------------------------------------------------------------------

      users = users.map((user) => {
        user.ad_accounts = adAccounts.filter((adAccount) => adAccount.user_id === user.id);
        return user;
      });

      return users;
    } else {

      let accountFilters = {business_id: businessId};
      let accounts = await this.UserAccountRepository.fetchUserAccounts(['*'], accountFilters);
      const userIds = accounts.map((account) => account.user_id);

      // Fetch users based on user_id
      let users = [];
      userIds.forEach(async user => {
        let userFilters = {id: user};

        const luxus = await this.userRepository.fetchUsers(['*'], userFilters);

        luxus.forEach(single => {
          users.push(single);
        })


      });


      const otherUserIds = users.map((user) => user.id);


      // Fetch ad_account ids of backup user accounts and exclude them from the ad accounts query.
      let whereClause = {};
      if (!isAdmin) whereClause['map.u_id'] = otherUserIds;

      const adAccounts = await this.adAccountRepository.fetchAdAccounts(
        [
          '*',
          'map.u_id AS user_id',
        ],
        whereClause,
        false,
        [
          {
            type: 'inner',
            table: 'u_aa_map AS map',
            first: `ad_accounts.id`,
            operator: '=',
            second: 'map.aa_id',
          },
        ],
      );

      // Logic for adding data for each ad account -----------------------------------------


      // Grab pixel data and inject it

      //await this.pixelService.syncPixels(users[0].token, adAccounts, "today");

      let whereClause2 = {};
      let pixels = await this.pixelService.fetchPixelsFromDatabase(
        [
          'fb_pixels.id',
          'fb_pixels.name',
          'fb_pixels.business_id',
          'fb_pixels.ad_account_id'
        ],

      );




      adAccounts.forEach(adacc => {
        adacc.pixels = [];


        pixels.forEach(pix => {

          if(pix.ad_account_id == adacc.id){

            console.log(pix.ad_account_id);
            adacc.pixels.push(pix);
          }
        });
        if(adacc.pixels.length > 0){
          console.log(`
          --------------------------------

            CORRECT RESULT
            ${adacc.id}
            ${JSON.stringify(adacc.pixels)}

          --------------------------------
          `);
        }


      });




      // Logic ends here -------------------------------------------------------------------

      users = users.map((user) => {
        user.ad_accounts = adAccounts.filter((adAccount) => adAccount.user_id === user.id);
        return user;
      });




      return users;
    }
  }

  async fetchUserAccounts(fields, filters, limit) {
    const userAccounts = await this.UserAccountRepository.fetchUserAccounts(fields, filters, limit);
    return userAccounts;
  }

  async getColumnPresets(user_id) {
    const presets = await this.database('column_presets').where('user_id', user_id);
    return presets;
  }

  async createColumnPreset(body) {
    assert(body.name, 'Name is required');
    assert(body.presets, 'Presets are required');
    assert(body.user_id, 'User ID is required');
    const response = await this.database('column_presets').insert(body).returning('*');
    return response[0];
  }

  async deleteColumnPreset(presetId) {
    assert(presetId, 'ID is required');
    const response = await this.database('column_presets').where('id', presetId).del();
    return response;
  }

  async getAuth0ManagementApiToken() {
    const url = `https://${EnvironmentVariablesManager.getEnvVariable('AUTH0_DOMAIN')}/oauth/token`;
    const payload = {
      client_id: EnvironmentVariablesManager.getEnvVariable('AUTH0_CLIENT_ID'),
      client_secret: EnvironmentVariablesManager.getEnvVariable('AUTH0_CLIENT_SECRET'),
      audience: `https://${EnvironmentVariablesManager.getEnvVariable('AUTH0_DOMAIN')}/api/v2/`,
      grant_type: 'client_credentials',
      scope: 'create:user_tickets', // Add other required scopes if necessary
    };

    const response = await axios.post(url, payload);
    return response.data.access_token;
  }

  async createPasswordChangeTicket(email) {
    const url = `https://${EnvironmentVariablesManager.getEnvVariable(
      'AUTH0_DOMAIN',
    )}/dbconnections/change_password`;

    const body = {
      client_id: EnvironmentVariablesManager.getEnvVariable('AUTH0_CLIENT_ID'),
      email: email,
      connection: 'Username-Password-Authentication',
    };

    // Note that we're not using an Auth0 Management API token here
    const response = await axios.post(url, body, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.data;
  }

  async updateUserDetails(userId, name) {
    const auth0Token = await this.getAuth0ManagementApiToken(); // Retrieve your Auth0 Management API token

    const url = `https://${EnvironmentVariablesManager.getEnvVariable(
      'AUTH0_DOMAIN',
    )}/api/v2/users/${userId}`;

    const headers = {
      Authorization: `Bearer ${auth0Token}`,
      'Content-Type': 'application/json',
    };

    const body = {};
    if (name) body.name = name;
    const response = await axios.patch(url, body, { headers });

    // If Auth0 update is successful, update the name in your UserRepository
    if (response.status === 200) {
      await this.userRepository.update({ name }, { sub: userId });
    }

    return response.data;
  }

  async updateSingleAdAccount(id,
    name,
    status,
    adpage,
    usertype,
    pixel,
    assigned
  ) {

    /*
    const auth0Token = await this.getAuth0ManagementApiToken(); // Retrieve your Auth0 Management API token

    const url = `https://${EnvironmentVariablesManager.getEnvVariable(
      'AUTH0_DOMAIN',
    )}/api/v2/users/${userId}`;

    const headers = {
      Authorization: `Bearer ${auth0Token}`,
      'Content-Type': 'application/json',
    };

    const body = {};
    if (name) body.name = name;
    const response = await axios.patch(url, body, { headers });
    */

    let output;
    try {
      const updatedField = {
        id,
        name,
        status,
        adpage,
        usertype,
        pixel,
        assigned
      };
      const criterion = {
        id: id
      };
      output = await this.adAccountRepository.update(updatedField, criterion);
    } catch (error) {
      console.log(error);
      throw error;
    }

    return output;
  }

  async fetchUser(id) {
    const user = await this.userRepository.fetchOne(['*'], { id });
    return user;
  }

  async fetchUserOrganization(userId) {
    const organization = await this.userRepository.fetchUserOrganization(userId);
    return organization;
  }

  async logCriticalError(errorData) {

    var error_var = false;

    try{
      this.fe_logger.info(errorData);
    } catch(error){
      console.log(error);
      error_var = true;
    }

    if(error_var){
      return {
        procedureStatus: 501
      }
    }else {
      return {
        procedureStatus: 200
      }
    }

  }
}

class TemporaryController {

  constructor() {
    this.temporaryService = new TemporaryService();
  }

  async fetchLinkGenerationUsageData(req, res) {
    try {
      const data = await this.temporaryService.fetchLinkGenerationUsageData();
      res.status(200).json(data);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async fetchOperationalErrors(req, res) {

    let { fields, filters, limit } = req.query;
    if (fields) fields = Array.isArray(fields) ? fields : JSON.parse(fields);
    if (filters) filters = Array.isArray(filters) ? filters : JSON.parse(filters);

    try {
      const errors = await this.temporaryService.fetchOperationalErrors(fields, filters, limit);
      res.status(200).json(errors);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async changeOperationalErrorStatus(req, res) {
    const { id, type, traffic_source, resolved } = req.body;
    console.log(req.body);
    try {
      await this.temporaryService.changeOperationalErrorStatus(id, type, traffic_source, resolved);
      res.status(200).json({ message: 'Operational error status changed successfully' });
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async fetchEffluxErrors(req, res) {

    let { fields, filters, limit } = req.query;
    if (fields) fields = Array.isArray(fields) ? fields : JSON.parse(fields);
    if (filters) filters = Array.isArray(filters) ? filters : JSON.parse(filters);

    try {
      const errors = await this.temporaryService.fetchEffluxErrors(fields, filters, limit);
      res.status(200).json(errors);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async changeEffluxErrorStatus(req, res) {
    const { id, resolved } = req.body;
    try {
      await this.temporaryService.changeEffluxErrorStatus(id, resolved);
      res.status(200).json({ message: 'Efflux error status changed successfully' });
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  // AD ACCOUNTS
  async fetchAdAccountsFromDatabase(req, res) {
    try {
      let { fields, filters, limit } = req.query;
      if (fields) fields = Array.isArray(fields) ? fields : JSON.parse(fields);
      if (filters) filters = Array.isArray(filters) ? filters : JSON.parse(filters);
      const adAccounts = await this.temporaryService.fetchAdAccountsFromDatabase(
        fields,
        filters,
        limit,
      );
      res.status(200).json(adAccounts);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async fetchMediaBuyerAdAccounts(req, res) {

    try {
      const fields = ['ad_accounts.name', 'ad_accounts.provider', 'ad_accounts.provider_id'];
      const filters = { "map.u_id": req.user.id };
      const limit = null;
      const joins = [
        {
          type: "inner",
          table: "u_aa_map AS map",
          first: `ad_accounts.id`,
          operator: "=",
          second: "map.aa_id",
        }
      ];
      const adAccounts = await this.temporaryService.fetchAdAccountsFromDatabase(
        fields,
        filters,
        limit,
        joins
      );
      res.status(200).json(adAccounts);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async unassignAdAccountFromUser(req, res) {
    const { adAccountId, userId, adAccountName, userName } = req.body;
    try {
      await this.temporaryService.unassignAdAccountFromUser(adAccountId, userId);
      res.status(200).json({ message: `Access to ${adAccountName} was removed from ${userName} successfully`});
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: `Failed to remove ${userName} access from ${adAccountName}` });
    }
  }

  async assignAdAccountToUser(req, res) {
    const { adAccountId, userId, adAccountName, userName } = req.body;
    try {
      await this.temporaryService.assignAdAccountToUser(adAccountId, userId);
      res.status(200).json({ message: `Successfully Assigned ${adAccountName} to ${userName}` });
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: `Failed to assign ${adAccountName} to ${userName}` });
    }
  }
  //  --------------------------------------------

  // NETWORK CAMPAIGNS
  async fetchNetworkCampaignsFromDatabase(req, res) {
    try {
      let { fields, filters, limit } = req.query;
      if (fields) fields = Array.isArray(fields) ? fields : JSON.parse(fields);
      if (filters) filters = Array.isArray(filters) ? filters : JSON.parse(filters);

      const networkCampaigns = await this.temporaryService.fetchNetworkCampaignsFromDatabase(
        fields,
        filters,
        limit,
      );
      res.status(200).json(networkCampaigns);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async fetchMediaBuyerNetworkCampaigns(req, res) {
    try {
      const fields = ['network_campaigns.id', 'network_campaigns.name', 'network_campaigns.network'];
      const filters = { "map.user_id": req.user.id };
      const limit = null;
      const joins = [
        {
          type: "inner",
          table: "network_campaigns_user_relations AS map",
          first: `network_campaigns.id`,
          operator: "=",
          second: "map.network_campaign_id",
        }
      ];

      const networkCampaigns = await this.temporaryService.fetchNetworkCampaignsFromDatabase(
        fields,
        filters,
        limit,
        joins
      );
      res.status(200).json(networkCampaigns);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async assignNetworkCampaignToUser(req, res) {
    const { network, networkCampaignId, userId, networkCampaignName, userName } = req.body;
    try {
      await this.temporaryService.assignNetworkCampaignToUser(network, networkCampaignId, userId);
      res.status(200).json({ message: `Successfully Assigned ${networkCampaignName} to ${userName}` });
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: `Failed to assign ${networkCampaignName} to ${userName}` });
    }
  }

  async unassignNetworkCampaignFromUser(req, res) {
    const { networkCampaignId, userId, userName, networkCampaignName } = req.body;
    try {
      const deleted = await this.temporaryService.unassignNetworkCampaignFromUser(networkCampaignId, userId);
      res.status(200).json({ message: `Access to ${networkCampaignName} was removed from ${userName} successfully` });
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: `Failed to remove ${networkCampaignName} access from ${userName}` });
    }
  }
  //  --------------------------------------------

  // This fetches users with their ad accounts and network campaigns relations

  async fetchUsersWithRelations(req, res) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      const userId = req.user.id;
      const isAdmin = req.user.roles.includes('admin');
      const users = await this.temporaryService.fetchUsersWithRelations(userId, isAdmin);
      res.status(200).json(users);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async fetchUsersWithAdAccountsForNewEfflux(req, res) {

    try {

      const userId = req.query.user_id;
      const businessId = req.query.business_id;
      console.log("ADMIN: " + req.query.user_id);
      const isAdmin = req.query.admin;
      const ts = req.query.ts;

      const users = await this.temporaryService.fetchUsersWithAdAccountsForNewEfflux(userId, businessId, isAdmin, ts);
      res.status(200).json(users);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async fetchUserAccounts(req, res) {
    try {
      let { fields, filters, limit } = req.query;
      if (fields) fields = JSON.parse(fields);
      if (filters) filters = JSON.parse(filters);

      if (fields) filters.user_id = req.user.id;
      else filters = { user_id: req.user.id };

      const userAccounts = await this.temporaryService.fetchUserAccounts(fields, filters, limit);
      res.status(200).json(userAccounts);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async getColumnPresets(req, res) {
    try {
      const { user_id } = req.query;
      const presets = await this.temporaryService.getColumnPresets(user_id);
      res.status(200).json(presets);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async createColumnPreset(req, res) {
    try {
      const response = await this.temporaryService.createColumnPreset(req.body);
      res.status(200).json(response);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async deleteColumnPreset(req, res) {
    try {
      const { id } = req.query;
      const response = await this.temporaryService.deleteColumnPreset(id);
      res.status(200).json(response);
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async updatePassword(req, res) {
    try {
      const { email } = req.body;

      const ticketUrl = await this.temporaryService.createPasswordChangeTicket(email);
      res
        .status(200)
        .json({ message: 'Password reset email sent successfully', ticketUrl: ticketUrl });
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  async updateUserDetails(req, res) {
    try {
      const { name, userId } = req.body;
      const user = userId || req.user.sub; // Ensure that the user's ID is available, typically through authentication middleware

      // Validate the input as necessary
      if (!name) {
        return res.status(400).json({ message: 'No update parameters provided.' });
      }

      // Call a service method to update the user details
      const updateResult = await this.temporaryService.updateUserDetails(user, name);
      // Construct a response message based on what was updated
      let message = 'User details updated successfully: ';
      if (name) message += 'Name ';

      res.status(200).json({ message: message.trim(), updateResult });
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  // update single field changes --- update domains, users changes
  async updateSingleAdAccount(req, res) {
    try {
      const {
        id,
        name,
        status,
        adpage,
        usertype,
        pixel,
        assigned,

      } = req.query;

      console.log(JSON.stringify(req.query))

      // Validate the id as necessary
      //if (!id) {
      //  return res.status(400).json({ message: 'No id parameters provided.' });
      //}

      // Validate the name as necessary
      //if (!name) {
      //  return res.status(400).json({ message: 'No name parameters provided.' });
      //}

      for (let key in req.query) {
        if (req.query[key] == null) {
          return res.status(400).json({ message: 'No ' + key + ' parameters provided.' });
        }
      }


      // Call a service method to update the user details
      /*
      const updateResult = await this.temporaryService.updateSingleAdAccount(
        id,
        name,
        status,
        currency,
        tz_name,
        adPage,
        userType,
        pixel,
        token,
        provider_id,
        created_at,
        updated_at,
        network,
        amount_spent,
        balance,
        assigned,
        spend_cap,
        tz_offset,
        fb_account_id,
        date_start,
        today_spent,
        org_id,
        user_access_data_pass,
        domains_assign_id
      );
      */
      const updateResult = await this.temporaryService.updateSingleAdAccount(
        id,
        name,
        status,
        adpage,
        usertype,
        pixel,
        assigned
      );


      res.status(200).json({ message: "Update run successfully", updateResult });
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: error.message });
    }
  }

  // This will be used to get ad accounts from a user_id. If the user is admin, it will get all ad accounts.
  async fetchUser(req, res) {
    try {
      const { id } = req.params;
      const user = await this.temporaryService.fetchUser(id);
      res.status(200).json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // This will be used to get the user organization
  async fetchUserOrganization(req, res) {
    try {
      const { userId } = req.params;
      const organization = await this.temporaryService.fetchUserOrganization(userId);
      res.status(200).json(organization);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async fetchUserOrganization(req, res) {
    try {
      const { userId } = req.params;
      const organization = await this.temporaryService.fetchUserOrganization(userId);
      res.status(200).json(organization);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async logCriticalError(req, res) {
    try {
      const { errorData } = req.body;
      const errorLogEvent = await this.temporaryService.logCriticalError(errorData);
      if(errorLogEvent.procedureStatus == 200){
        res.status(200).json({message: "Error successfully logged."});
      } else {
        res.status(501).json({message: "Error could not be logged."});
      }

    } catch (error) {
      res.status(500).json({ message: "Error could not be logged. Internal fault." });
    }
  }
}

module.exports = {
  TemporaryController,
  TemporaryService
};
