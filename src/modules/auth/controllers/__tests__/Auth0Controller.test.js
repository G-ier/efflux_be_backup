const Auth0Controller = require("../Auth0Controller");
const _ = require("lodash");

jest.mock("../../services/Auth0Service");
jest.mock("../../services/UserService");

describe("Auth0Controller", () => {
  let req;
  let res;
  let auth0Controller;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      user: {
        permissions: [],
        token: "user_token",
      },
    };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res),
      send: jest.fn(),
    };

    auth0Controller = new Auth0Controller();
  });

  describe("login", () => {
    it("should return the expected response when login is successful", async () => {
      // Arrange
      const user = {
        permissions: ["user"],
        token: "user_token",
      };
      const account = {};
      req.user = user;
      req.body = account;

      const userDetails = {
        acct_type: "user",
        id: "123",
        name: "John Doe",
        email: "john@example.com",
      };

      const users = [
        {
          id: "1",
          name: "Alice",
          ad_account_id: "1a",
          accountType: "admin",
          ad_account_name: "Ad Account 1",
          ad_account_provider: "Provider 1",
        },
        {
          id: "2",
          name: "Bob",
          ad_account_id: null,
          accountType: "media_buyer",
        },
      ];

      auth0Controller.auth0Service.login.mockResolvedValue(userDetails);
      auth0Controller.userService.getQueriedUsers.mockResolvedValue(users);

      // Act
      await auth0Controller.login(req, res);

      // Assert
      const expectedResponse = {
        userDetails: {
          accountType: "user",
          userId: "123",
          name: "John Doe",
          email: "john@example.com",
          token: "user_token",
        },
        roleData: {
          admin: {
            users: [
              {
                userId: "1",
                name: "Alice",
                ad_accounts: [
                  {
                    id: "1a",
                    name: "Ad Account 1",
                    provider: "Provider 1",
                  },
                ],
              },
            ],
          },
          mediaBuyer: [
            {
              userId: "2",
              name: "Bob",
              ad_accounts: [],
            },
          ],
        },
      };
      expect(res.json).toHaveBeenCalledWith(expectedResponse);
    });

    it("should return a 500 status and error message when an error occurs", async () => {
      // Arrange
      const errorMessage = "Failed to login using Auth0.";
      auth0Controller.auth0Service.login.mockRejectedValue(new Error(errorMessage));

      // Act
      await auth0Controller.login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(errorMessage);
    });
  });
});
