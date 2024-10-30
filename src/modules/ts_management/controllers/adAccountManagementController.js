// Third party imports
const _ = require('lodash');
const assert = require('assert');
const axios = require('axios');

// Local imports
const AdAccountManagementService = require('../services/adAccountManagementService');


class AdAccountManagementController {

  constructor() {
    this.adAccountManagementService = new AdAccountManagementService();
  }

  async excludeAdAccount(req, res) {
    const { adAccountId, adAccountProviderId, trafficSource, name, mediaBuyer } = req.body;
    console.log("Params");
    console.log(adAccountId, adAccountProviderId, trafficSource,);
    if(mediaBuyer != 'admin'){
      res.status(403).json({ message: `Restricted access.` });
    }
    try {
      const exclusionProcess = await this.adAccountManagementService.excludeAdAccount(adAccountId, adAccountProviderId, trafficSource, name, mediaBuyer);
      if(exclusionProcess.status == 200){
        res.status(200).json({ message: `Campaign with ID to ${adAccountId} was hidden form users.` });
      } else {
        res.status(500).json({ message: `Failed to hide campaign with ID${adAccountId}` });
      }
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: `Failed to hide campaign with ID${adAccountId}` });
    }
  }

  async includeExcludedAdAccount(req, res) {
    const { id, adAccountId, mediaBuyer } = req.body;
    console.log("Params");
    console.log(adAccountId);
    if(mediaBuyer != 'admin'){
      res.status(403).json({ message: `Restricted access.` });
    }
    try {
      const inclusionProcess = await this.adAccountManagementService.includeExcludedAdAccount(id, adAccountId, mediaBuyer);
      if(inclusionProcess.status == 200){
        res.status(200).json({ message: `Campaign with ID to ${adAccountId} was hidden form users.` });
      } else {
        res.status(500).json({ message: `Failed to hide campaign with ID${adAccountId}` });
      }
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: `Failed to hide campaign with ID${adAccountId}` });
    }
  }

  async fetchAdAccounts(req, res){
    try {
      const fetchProcess = await this.adAccountManagementService.fetchAdAccounts();
      if(fetchProcess.status == 200){
        res.status(200).json({ message: `Accounts fetched.`, data: fetchProcess.adAccounts });
      } else {
        res.status(500).json({ message: `Accounts not fetched.`, data: [] });
      }
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: `Accounts not fetched.` });
    }
  }

  async fetchExcludedAdAccounts(req, res){
    try {
      const fetchProcess = await this.adAccountManagementService.fetchExcludedAdAccounts();
      if(fetchProcess.status == 200){
        res.status(200).json({ message: `Accounts fetched.`, data: fetchProcess.adAccounts });
      } else {
        res.status(500).json({ message: `Accounts not fetched.`, data: [] });
      }
    } catch (error) {
      console.log('ERROR', error);
      res.status(500).json({ message: `Accounts not fetched.` });
    }
  }
}

module.exports = AdAccountManagementController;
