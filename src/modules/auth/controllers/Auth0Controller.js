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

  handleFailCases(data){
    return {
      "process_code": "500",
      "message": data.message,
      "auth0_code": data.statusCode
    }
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


      const userCreationResponse = await this.auth0Service.createAuth0User({ email, password, fullName, username });

      console.log(JSON.stringify(userCreationResponse.data));

      if(userCreationResponse.status == 201){
        // Insert user to database
        const insert_event = await this.userService.createUser(userCreationResponse.data, rights, password, username);

        if(insert_event.insertion_result == "OK"){
          res.status(200).json({"process_code": "200"});
        } else {
          res.status(201).json({"process_code": "201"});
        }
      } else {
        const fail_data = handleFailCases(userCreationResponse.status);
        res.status(500).json(fail_data);
      }


    } catch (error) {
      console.error('Error during user creation:', error);
      res.status(500).send('Failed to create user using Auth0.');
    }
  }

  // Method to handle user creation
  async inviteUser(req, res) {
    try {
      const { email, rights, mediaBuyer, ...otherParams } = await this.extractRequestDataWithUser(req);

      if(mediaBuyer!="admin"){
        throw new Error("No rights for this action.");
      }

      // Get full name
      const fullName = email.split('@')[0];

      // Generate a random password
      const password = generateRandomPassword();

      const userCreationResponse = await this.auth0Service.createAuth0User({ email, password, fullName, username: fullName });

      if(userCreationResponse.status == 201){
        // Insert user to database
        const insert_event = await this.userService.createUser(userCreationResponse.data, rights, password);

        if(insert_event.insertion_result == "OK"){
          // Send email invitation
          await this.emailService.sendInvitationEmail(email, fullName, "Efflux", password);
          res.status(200).json({"process_code": "200"});
        } else {
          res.status(200).json({"process_code": "201", "message": "Database was not successfully updated. Run refresh."});
        }
      } else {
        const fail_data = this.handleFailCases(userCreationResponse.data);
        res.status(500).json(fail_data);
      }


    } catch (error) {
      console.log(error);
      const fail_data_catch = this.handleFailCases(error.response.data);
      res.status(500).json(fail_data_catch);
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
      const toBeDeletedUser = await this.auth0Service.deleteAuth0User(user_id[0].providerId);

      // Delete user from database if previous action is successful
      if(toBeDeletedUser.status == 204){

        // Error handler var
        var deletion_error = false;
        // Insert user to database
        const delete_event = await this.userService.deleteUser(selectedUser).catch(error => {
          deletion_error = true;
        });

        if(!deletion_error){
          res.status(200).json({"process_code": "200"});
        } else {
          res.status(201).json({"process_code": "201"});
        }
      } else {
        const fail_data = handleFailCases(userCreationResponse.status);
        res.status(500).json(fail_data);
      }



    } catch (error) {
      console.log(error);
      const fail_data_catch = this.handleFailCases(error.response.data);
      res.status(500).json(fail_data_catch);
    }
  }

  // Method to handle user edit
  async editUser(req, res) {
    try {

      const { selectedUser, username, email, password, rights, mediaBuyer, ...otherParams } = await this.extractRequestDataWithUser(req);

      if(mediaBuyer!="admin"){
        throw new Error("No rights for this action.");
      }

      // Delete user from auth0
      const toBeEditedUser = await this.auth0Service.editUser(selectedUser, username, email, password, rights);

      // Delete user to database if previous action is successful
      // TODO

    } catch (error) {
      console.error('Error during user editing:', error);
      res.status(500).send('Failed to edit user using Auth0.');
    }
  }
}

module.exports = Auth0Controller;
