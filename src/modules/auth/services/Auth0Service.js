// Third part imports
const axios = require('axios');

// Local application imports
const UserService = require('./UserService');
const RoleService = require('./RoleService');
const EnvironmentVariablesManager = require('../../../shared/services/EnvironmentVariablesManager');
const EmailsService = require('../../../shared/lib/EmailsService');
const {UserManagementLogger} = require('../../../shared/lib/WinstonLogger');
const {generateRandomPassword} = require('../../../shared/helpers/Utils');

class Auth0Service {
  constructor() {
    this.userService = new UserService();
    this.roleService = new RoleService();
    this.emailService = new EmailsService;
    this.user_logger = UserManagementLogger;
  }

  handleFailCases(data){
    return {
      "process_code": "501",
      "message": data.message,
      "auth0_code": data.statusCode
    }
  }

  async getAuth0AccessToken() {
    try {
      const result = await axios.post(`https://${EnvironmentVariablesManager.getEnvVariable('AUTH0_DOMAIN')}/oauth/token`, {
        client_id: EnvironmentVariablesManager.getEnvVariable('AUTH0_CLIENT_ID'),
        client_secret: EnvironmentVariablesManager.getEnvVariable('AUTH0_CLIENT_SECRET'),
        audience: EnvironmentVariablesManager.getEnvVariable('AUTH0_API'),
        grant_type: 'client_credentials',
      })

      if (result.status === 200 && result.data.access_token !== null) {
        return `${result.data.token_type} ${result.data.access_token}`;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching Auth0 access token', error);
      return null;
    }
  }

  async getAuth0User(sub) {
    const Authorization = await this.getAuth0AccessToken();

    const { data: user } = await axios.get(
      `${EnvironmentVariablesManager.getEnvVariable('AUTH0_API')}users/${sub}`,
      {
        headers: {
          Authorization,
        },
      },
    );

    return user;
  }

  async createAuth0User({ email, password, fullName, username }) {
    const Authorization = await this.getAuth0AccessToken();
    return axios.post(
      `${EnvironmentVariablesManager.getEnvVariable('AUTH0_API')}users`,
      {
        email,
        password,
        name: fullName,
        connection: 'Username-Password-Authentication',
      },
      {
        headers: {
          Authorization,
        },
      },
    );
  }

  async deleteAuth0User(selectedUser) {
    const Authorization = await this.getAuth0AccessToken();
    return axios.delete(
      `${EnvironmentVariablesManager.getEnvVariable('AUTH0_API')}users/${selectedUser}`,
      {
        headers: {
          Authorization,
        },
      },
    );
  }


  /*
    200 - Auth0 edited AND DB edited
    201 - Only Auth0 edited
    203 - Auth0 non necessary but DB edited
    500 - Unexplainable internal error
    501 - Explainable internal error
  */
  async editAuth0User(selectedAuthUser, email, name, password) {
    const Authorization = await this.getAuth0AccessToken();

    let data;

    if(email != null){
      if(name != null){
        if(password != null){
          data = JSON.stringify({
            "email": email,
            "name": name,
            "password": password,
            "connection": "Username-Password-Authentication",
          });
        } else {
          data = JSON.stringify({
            "email": email,
            "name": name,
            "connection": "Username-Password-Authentication",
          });
        }
      } else {
        if(password != null){
          data = JSON.stringify({
            "email": email,
            "password": password,
            "connection": "Username-Password-Authentication",
          });
        } else {
          data = JSON.stringify({
            "email": email,
            "connection": "Username-Password-Authentication",
          });
        }
      }
    } else {
      if(name != null){
        if(password != null){
          data = JSON.stringify({

            "name": name,
            "password": password,
            "connection": "Username-Password-Authentication",
          });
        } else {
          data = JSON.stringify({

            "name": name,
            "connection": "Username-Password-Authentication",
          });
        }
      } else {
        if(password != null){
          data = JSON.stringify({

            "password": password,
            "connection": "Username-Password-Authentication",
          });
        } else {
          return {process: "202", message: "Process runs OK but unnecessary."};
        }
      }
    }

    let config = {
      method: 'patch',
      maxBodyLength: Infinity,
      url: `${EnvironmentVariablesManager.getEnvVariable('AUTH0_API')}users/${selectedAuthUser}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        Authorization
      },
      data : data
    };

    const response = axios.request(config);

    return response;
  }

  /*

  Returned from Auth0

  204 - Roles successfully associated with user.
  400 - Invalid request body. The message will vary depending on the cause.
  401 - Invalid token.
  401 - Client is not global.
  401 - Invalid signature received for JSON Web Token validation.
  403 - Insufficient scope; expected any of: read:roles, update:users.
  429 - Too many requests. Check the X-RateLimit-Limit, X-RateLimit-Remaining and X-RateLimit-Reset headers.

  Role IDs

  Admin - rol_d1uGNi0kkVrNJBrH
  Media Buyer - rol_tuNQ0khtYkGW6ZJt

  */
  async assignAuth0Role(id, role) {
    const Authorization = await this.getAuth0AccessToken();
    return await axios.post(
      `${EnvironmentVariablesManager.getEnvVariable('AUTH0_API')}users/${id}/roles`,
      {
        "roles": [
          role == 'admin' ? 'rol_d1uGNi0kkVrNJBrH' : 'rol_tuNQ0khtYkGW6ZJt'
        ]
      },
      {
        headers: {
          Authorization,
        },
      },
    );
  }


  getUserIdentity(userFromAuth0) {
    const oauthProviders = ['facebook', 'google'];
    const oauthIdentity = userFromAuth0.identities.find(
      (identity) => oauthProviders.indexOf(identity.provider) !== -1,
    );
    const auth0Identity = userFromAuth0.identities.find(
      (identity) => identity.provider === 'auth0',
    );

    return {
      provider: oauthIdentity ? oauthIdentity.provider : 'auth0',
      providerId: oauthIdentity ? oauthIdentity.user_id : auth0Identity.user_id,
    };
  }

  async login(reqUser, account) {
    const { name, email, image_url, nickname, sub } = account;
    const acct_type = reqUser?.roles?.includes('admin') ? 'admin' : 'media_buyer';
    const userFromAuth0 = await this.getAuth0User(sub);
    const identity = this.getUserIdentity(userFromAuth0);

    const user = await this.userService.fetchOne(['*'], {email});

    // If it doesn't exist, create a user in the database
    if (!user) {
      const role = await this.roleService.fetchOne(["*"],{name:acct_type?.replace("_"," ")})
      const userId = await this.userService.saveUser({
        name,
        nickname,
        email,
        image_url,
        sub,
        acct_type,
        role:role?.id,
        org_id:1,
        ...identity,
      });

      return { id: userId,...user, ...userFromAuth0, };
    }
    // If the user exists but his permissions are different, update them
    else {
      if (user.acct_type !== acct_type)
        await this.userService.updateUser({ acct_type }, { id: user.id });
      return { id: user.id, acct_type: acct_type,...user, ...userFromAuth0  };
    }
  }

  // Method to handle user creation
  /*

    Auth0 codes

    204 - Role assigned successfully

    Our codes

    205 - Error: No role assigned to user

  */
  async createUser(fullName, username, email, password, rights, mediaBuyer) {
    try {

      const userCreationResponse = await this.createAuth0User({ email, password, fullName, username });

      let userRoleAssignment = {status: 501, data: {"message": "User not created in Auth0.", "auth0_code": userCreationResponse.status}};
      if(userCreationResponse.status == 201){
        userRoleAssignment = await this.assignAuth0Role(userCreationResponse.data.user_id, rights).catch(error => {
          this.user_logger.error(error);
        });

        // Handle undefined, success, error cases
        if(userRoleAssignment === undefined){
          userRoleAssignment = {status: 205, data: {"message": "No role assigned to user.", "auth0_code": 500}};
        } else {
          if(userRoleAssignment.status != 204){
            userRoleAssignment = {status: 205, data: {"message": "No role assigned to user.", "auth0_code": userRoleAssignment.status}};
          } else {
            userRoleAssignment = {status: 200, data: {"message": "User rights edited.", "auth0_code": userRoleAssignment.status}};
          }
        }
      }

      if(userCreationResponse.status == 201){
        // Insert user to database
        const insert_event = await this.userService.createUser(userCreationResponse.data, rights, password, username);

        if(insert_event.insertion_result == "OK"){
          return {"process_code": "200", "role_process_code": userRoleAssignment.status, "message": userRoleAssignment.data.message};
        } else {
          return {"process_code": "201"};
        }
      } else {
        const fail_data = handleFailCases(userCreationResponse.status);
        return fail_data;
      }


    } catch (error) {
      console.log(error);
      if (error?.response?.data) {
        const fail_data_catch = this.handleFailCases(error.response.data);
        return fail_data_catch;
      }
      this.user_logger.info(error);
      return {
        "message": "Internal error in server."
      }
    }
  }

  // Method to handle user creation
  /*

    Auth0 codes

    204 - Role assigned successfully

    Our codes

    205 - Error: No role assigned to user

  */
  async inviteUser(email, rights, mediaBuyer) {
    try {

      // Get full name
      const fullName = email.split('@')[0];

      // Generate a random password
      const password = generateRandomPassword();

      const userCreationResponse = await this.createAuth0User({ email, password, fullName, username: fullName });

      let userRoleAssignment = {status: 501, data: {"message": "User not created in Auth0.", "auth0_code": userCreationResponse.status}};
      if(userCreationResponse.status == 201){
        userRoleAssignment = await this.assignAuth0Role(userCreationResponse.data.user_id, rights).catch(error => {
          this.user_logger.error(error);
        });

        // Handle undefined, success, error cases
        if(userRoleAssignment === undefined){
          userRoleAssignment = {status: 205, data: {"message": "No role assigned to user.", "auth0_code": 500}};
        } else {
          if(userRoleAssignment.status != 204){
            userRoleAssignment = {status: 205, data: {"message": "No role assigned to user.", "auth0_code": userRoleAssignment.status}};
          } else {
            userRoleAssignment = {status: 200, data: {"message": "User with rights created.", "auth0_code": userRoleAssignment.status}};
          }
        }


      }



      if(userCreationResponse.status == 201){
        // Insert user to database
        const insert_event = await this.userService.createUser(userCreationResponse.data, rights, password);

        if(insert_event.insertion_result == "OK"){
          // Send email invitation
          const email_response = await this.emailService.sendInvitationEmail(email, fullName, "Efflux", password, userRoleAssignment.status).catch(error => {
            return {"process_code": "203", "message": "Invitation not sent."}
          });
          if(email_response.status == 200){
            return {"process_code": "200", "role_process_code": userRoleAssignment.status, "message": userRoleAssignment.data.message};
          } else if (email_response.message == "Invitation sent successfully"){
            return {"process_code": "200", "role_process_code": userRoleAssignment.status, "message": userRoleAssignment.data.message};
          } else {
            return {"process_code": "203", "message": "Invitation not sent."}
          }

        } else {
          return {"process_code": "201", "message": "Database was not successfully updated. Run refresh."};
        }
      } else {
        const fail_data = this.handleFailCases(userCreationResponse.data);
        return fail_data;
      }


    } catch (error) {
      console.log(error);
      if (error?.response?.config && error.response.config == "https://emails.effluxboard.com/invitation/new") {
        const fail_data_catch = this.handleFailCases({message: "User created but invitation not sent.", statusCode: "200"});
        return fail_data_catch;
      }
      if (error?.response?.data) {
        const fail_data_catch = this.handleFailCases(error.response.data);
        return fail_data_catch;
      }

      this.user_logger.info(error);
      return {
        "message": "Internal error in server."
      }
    }
  }

  // Method to handle user delete
  async deleteUser(selectedUser, mediaBuyer) {
    try {

      // Get auth0 user's id from the database
      const user_id = await this.userService.fetchUsers(['"providerId"'], {id: selectedUser});

      console.log("User ID");
      console.log(user_id);

      // Delete user from auth0
      const toBeDeletedUser = await this.deleteAuth0User(user_id[0].providerId);

      // Delete user from database if previous action is successful
      if(toBeDeletedUser.status == 204){

        // Error handler var
        var deletion_error = false;
        // Insert user to database
        const delete_event = await this.userService.deleteUser(selectedUser).catch(error => {
          deletion_error = true;
        });

        if(!deletion_error){
          return {"process_code": "200"};
        } else {
          return {"process_code": "201"};
        }
      } else {
        const fail_data = handleFailCases(userCreationResponse.status);
        return fail_data;
      }



    } catch (error) {
      console.log(error);
      if (error?.response?.data) {
        const fail_data_catch = this.handleFailCases(error.response.data);
        return fail_data_catch;
      }
      this.user_logger.info(error);
      return {
        "message": "Internal error in server."
      }
    }
  }

  // Method to handle user edit
  /*
    200 - Auth0 edited AND DB edited
    201 - Only Auth0 edited
    203 - Auth0 non necessary but DB edited
    500 - Unexplainable internal error
    501 - Explainable internal error
  */
  async editUser(selectedUser, fullName, username, email, password, rights, mediaBuyer) {
    try {

      // Get auth0 user's id from the database
      const user_id = await this.userService.fetchUsers(['"providerId"'], {id: selectedUser});


      // Delete user from auth0
      let editTrueResponse = {
        edit: "unnecessary",
        status: 300 // Unnecessary
      };
      if(fullName || email || password){

        const editResponse = await this.editAuth0User(user_id[0].providerId, email, fullName, password);
        editTrueResponse = editResponse;
      }

      // Nothing necessary weird case
      if(editTrueResponse == null){

        let edit_null_event = {edit_result: "UNSTARTED", message: "DB update process did not run."};

        try {
          edit_null_event = await this.userService.editUser(user_id[0].providerId, selectedUser, fullName, username, email, password, rights);

          if(edit_null_event.edit_result == "OK"){

            return {"process_code": "203", "message": "Auth0 update not necessary. DB ok."};
          } else if(edit_null_event.edit_result == "UNSTARTED"){
            return {"process_code": "500", "message": "DB update process did not run."};
          }else {

            return {"process_code": "500", "message": "Database was not successfully updated. Run refresh."};
          }

        } catch (error) {
          this.user_logger.error(error);
          return {"process_code": "500", "message": "Database was not successfully updated. Run refresh."};
        }

      }

      // Change the rights
      if(editTrueResponse.status == 300 && rights){

        let userRoleAssignment = {status: 300, data: {"message": "Auth process defaults.", "auth0_code": editTrueResponse.status}};

        try{
          userRoleAssignment = await this.assignAuth0Role(user_id[0].providerId, rights);
        } catch(error){
          this.user_logger.error(error);
        }

        // Handle undefined, success, error cases
        if(userRoleAssignment === undefined){
          userRoleAssignment = {status: 205, data: {"message": "No role assigned to user.", "auth0_code": 500}};
        } else {
          if(userRoleAssignment.status != 204){
            userRoleAssignment = {status: 205, data: {"message": "No role assigned to user.", "auth0_code": userRoleAssignment.status}};
          } else {
            userRoleAssignment = {status: 200, data: {"message": "User rights edited.", "auth0_code": userRoleAssignment.status}};
          }
        }


        // Edit user in database if previous action is successful
        const edit_event = await this.userService.editUser(user_id[0].providerId, selectedUser, fullName, username, email, password, rights);

        if(edit_event.edit_result == "OK"){

          return {"process_code": "200", "role_process_code": userRoleAssignment.status, "message": userRoleAssignment.data.message};
        } else {
          return {"process_code": "201", "message": "Database was not successfully updated. Run refresh."};
        }
      }

      // Change the info
      if(editTrueResponse.status == 200){

        // Edit user in database if previous action is successful
        const edit_event = await this.userService.editUser(user_id[0].providerId, selectedUser, fullName, username, email, password, rights);

        if(edit_event.edit_result == "OK"){

          return {"process_code": "200"};
        } else {
          return {"process_code": "201", "message": "Database was not successfully updated. Run refresh."};
        }
      } else {
        const fail_data = this.handleFailCases(editResponse.data);
        return fail_data;
      }



    } catch (error) {
      console.log(error);
      if (error?.response?.data) {
        const fail_data_catch = this.handleFailCases(error.response.data);
        return fail_data_catch;
      }
      this.user_logger.info(error);
      return {
        "message": "Internal error in server."
      }
    }
  }
  async log_error(error) {
    this.user_logger.error(error);
  }
}

module.exports = Auth0Service;
