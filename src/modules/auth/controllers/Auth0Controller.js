// Local application imports
const Auth0Service = require('../services/Auth0Service');
const {generateRandomPassword} = require('../../../shared/helpers/Utils');
const UserService = require('../services/UserService');
const EmailsService = require('../../../shared/lib/EmailsService');
const EnvironmentVariablesManager = require('../../../shared/services/EnvironmentVariablesManager');

class Auth0Controller {
  constructor() {
    this.auth0Service = new Auth0Service();
    this.userService = new UserService();
    this.emailService = new EmailsService();
  }

  async extractRequestDataWithUser(req) {
    try {
      const user = req.user;
      let { mediaBuyer, ...otherParams } = req.method === 'POST' ? req.body : req.query;
      if (EnvironmentVariablesManager.getEnvVariable('DISABLE_AUTH_DEADLOCK') !== 'true') {
        if (!user) {
          throw new Error('User information not available in the request');
        }

        // Check if the user has 'admin' permission
        const isAdmin = user.roles && user.roles.includes('admin');
        // If the user is not an admin, enforce mediaBuyer to be the user's ID
        if (!isAdmin) {
          mediaBuyer = user.id; // Assuming 'id' is the user's identifier
        }
      }
      return { ...otherParams, mediaBuyer, user };
    } catch (e) {
      console.log(`Error in extracting user: ${JSON.stringify(e)}`);
      throw e;
    }
  }

  // Method to handle user login
  async login(req, res) {
    try {
      const user = req.user;
      console.log(`
      ------------------------------------
        USER

        ${user}
      ------------------------------------
      `);
      const account = req.body;
      const userDetails = await this.auth0Service.login(user, account);
      res.json(userDetails);
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).send('Failed to login using Auth0.');
    }
  }

  // Method to handle user creation
  async getUsers(req, res) {
    try {
      const { mediaBuyer, ...otherParams } = await this.extractRequestDataWithUser(req);

      if(mediaBuyer!="admin"){
        throw new Error("No rights for this action.");
      }

      // Get check
      var get_error = false;

      const userGetResponse = await this.userService.getUsers().catch(error => {
        get_error = true;
        console.log("Retrieval error.");
        console.log(error);
      });

      if(!get_error){
        res.status(200).json({"process_code": "200", "users": userGetResponse});
      } else {
        console.log("Retrieval failed.");
      }


    } catch (error) {
      console.error('Error during user retrieval:', error);
      res.status(500).send('Failed to gets users, INTERNAL ERROR.');
    }
  }

  // Method to handle user creation
  async createUser(req, res) {
    try {
      const { fullName, username, email, password, rights, mediaBuyer, ...otherParams } = await this.extractRequestDataWithUser(req);

      console.log(mediaBuyer);

      if(mediaBuyer!="admin"){
        throw new Error("No rights for this action.");
      }

      const userCreationResponse = await this.auth0Service.createUser(fullName, username, email, password, rights, mediaBuyer);

      if(userCreationResponse.process_code == "200"){
        res.status(200).json({"process_code": "200"});
      } else if(userCreationResponse.process_code == "201") {
        res.status(201).json({"process_code": "201"});
      } else {
        res.status(500).json(userCreationResponse);
      }

    } catch (error) {
      console.log(error);
      res.status(501).json(error);
    }
  }

  // Method to handle user creation
  async inviteUser(req, res) {
    try {
      const { email, rights, mediaBuyer, ...otherParams } = await this.extractRequestDataWithUser(req);

      if(mediaBuyer!="admin"){
        throw new Error("No rights for this action.");
      }

      const userCreationResponse = await this.auth0Service.inviteUser(email, rights, mediaBuyer);

      if(userCreationResponse.process_code == "200"){
        res.status(200).json({"process_code": "200"});
      } else if(userCreationResponse.process_code == "201") {
        res.status(201).json({"process_code": "201"});
      } else {
        res.status(500).json(userCreationResponse);
      }


    } catch (error) {

      console.log(error);
      res.status(501).json(error);
    }
  }

  // Method to handle user delete
  async deleteUser(req, res) {
    try {

      const { selectedUser, mediaBuyer, ...otherParams } = await this.extractRequestDataWithUser(req);

      if(mediaBuyer!="admin"){
        throw new Error("No rights for this action.");
      }

      // Get auth0 user's id from the database
      const user_id = await this.userService.fetchUsers(['"providerId"'], {id: selectedUser});

      console.log("User ID");
      console.log(user_id);

      // Delete user from auth0
      const toBeDeletedUser = await this.auth0Service.deleteUser(selectedUser, mediaBuyer);


      if(toBeDeletedUser.process_code == "200"){
        res.status(200).json({"process_code": "200"});
      } else if(toBeDeletedUser.process_code == "201") {
        res.status(201).json({"process_code": "201"});
      } else {
        res.status(500).json(toBeDeletedUser);
      }


    } catch (error) {
      console.log(error);
      res.status(501).json(error);
    }
  }

  // Method to handle user edit
  async editUser(req, res) {
    try {

      const { selectedUser, fullName, username, email, password, rights, mediaBuyer, ...otherParams } = await this.extractRequestDataWithUser(req);

      if(mediaBuyer!="admin"){
        throw new Error("No rights for this action.");
      }

      const editResponse = await this.auth0Service.editUser(selectedUser, fullName, username, email, password, rights, mediaBuyer);

      if(editResponse.process_code == "200"){
        res.status(200).json({"process_code": "200"});
      } else if(editResponse.process_code == "201") {
        res.status(201).json({"process_code": "201"});
      } else {
        res.status(500).json(editResponse);
      }


    } catch (error) {
      console.log(error);
      res.status(501).json(error);
    }
  }
}

module.exports = Auth0Controller;
