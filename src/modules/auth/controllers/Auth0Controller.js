// Local application imports
const Auth0Service = require('../services/Auth0Service');

class Auth0Controller {
  constructor() {
    this.auth0Service = new Auth0Service();
  }

  // Method to handle user login
  async login(req, res) {
    try {
      const user = req.user;
      const account = req.body;
      const userDetails = await this.auth0Service.login(user, account);
      res.json(userDetails);
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).send('Failed to login using Auth0.');
    }
  }

  // Method to handle user creation
  async createUser(req, res) {
    try {
      const { email, password } = req.body;
      const user = await this.auth0Service.createAuth0User({ email, password });
      res.json(user);
    } catch (error) {
      console.error('Error during user creation:', error);
      res.status(500).send('Failed to create user using Auth0.');
    }
  }
}

module.exports = Auth0Controller;
