// Local application imports
const Auth0Service = require('../services/Auth0Service');
const RoleService = require('../services/RoleService');
const UserService = require('../services/UserService');
const OrganizationService = require('../../organizations/services/OrganizationService');
const EnvironmentVariablesManager = require("../../../shared/services/EnvironmentVariablesManager");

const axios = require('axios');
const generator = require('generate-password');

class UsersController {
  constructor() {
    this.userService = new UserService();
    this.auth0Service = new Auth0Service();
    this.roleService = new RoleService();
    this.organizationService = new OrganizationService();
  }

  async createUser(req, res) {
    try {
      const { fullName, email, role } = req.body;
      let organizationName = '';
      const role_name = role?.toLowerCase()
      const role_obj = await this.roleService.fetchOne(['*'], { name: role_name });
      const role_id = role_obj?.id
      if (req.user.org_id) {
        const organization = await this.organizationService.fetchOne(['*'], { id: req.user.org_id });
        organizationName = organization?.name;
      }

      // Generate an 8-character alphanumeric password
      const password = generator.generate({
        length: 8,
        numbers: true,
        symbols: true,
        uppercase: true,
        strict: true,
      });

      // Create user in Auth0
      const orgId = req.user.org_id
      const roles = [role_name]
      const auth0User = await this.auth0Service.createAuth0User({ email, password, fullName, orgId, roles });

      // If Auth0 user creation is successful, create the user locally
      if (auth0User) {
        const localUser = await this.userService.saveUser({
          ...auth0User.data,
          providerId: auth0User.data.user_id.split('|')[1],
          org_id: req.user.org_id,
          role_id,
        });


        const emailUrl = EnvironmentVariablesManager.getEnvVariable('EMAILS_SERVICE_ENDPOINT') + 'emails/invitation/new';


        const emailResponse = await axios.post(emailUrl, {
          to: email,
          firstName: fullName,
          organizationName,
          tempPassword: password,
        });

        if (!emailResponse) {
          res.json({ success: false, message: 'User created but email failed to send', localUser });
        }

        res.json({ success: true, message: 'User created successfully', localUser });
      } else {
        res.status(500).json({ success: false, message: 'Failed to create user in Auth0' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async saveUser(req, res) {
    const user = req.body;
    const result = await this.userService.saveUser(user);
    res.json(result);
  }

  async saveUsersInBulk(req, res) {
    const { users, chunkSize } = req.body;
    const result = await this.userService.saveUsersInBulk(users, chunkSize);
    res.json(result);
  }

  async fetchUserOrganization(req, res) {
    const { userId } = req.params;
    const result = await this.userService.fetchUserOrganization(userId);
    res.json(result);
  }

  async updateUser(req, res) {
    const { data, criteria } = req.body;
    const result = await this.userService.updateUser(data, criteria);
    res.json(result);
  }

  async deleteUser(req, res) {
    const { criteria } = req.body;
    const result = await this.userService.deleteUser(criteria);
    res.json(result);
  }

  async upsertUsers(req, res) {
    const { users, chunkSize } = req.body;
    const result = await this.userService.upsertUsers(users, chunkSize);
    res.json(result);
  }

  async fetchUsers(req, res) {
    const { fields, filters, limit } = req.query;
    const results = await this.userService.fetchUsers(fields, filters, limit);
    res.json(results);
  }

  async fetchUserPermissions(userId) {
    const results = await this.userService.fetchUserPermissions(userId);
    return results;
  }
}

module.exports = UsersController;
