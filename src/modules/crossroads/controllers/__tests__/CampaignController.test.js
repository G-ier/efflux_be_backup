const CampaignService = require("../../services/CampaignService");
const CampaignController = require("../CampaignController");

jest.mock("../../services/CampaignService");

describe("CampaignController", () => {
  let req;
  let res;
  let campaignController;

  beforeEach(() => {
    // Mock request and response objects
    req = {
      params: {},
      body: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };

    // Instantiate the controller with the mocked service
    campaignController = new CampaignController();
  });

  describe("getAllCampaigns", () => {
    it("should return all campaigns", async () => {
      // Arrange
      const campaigns = [{ id: 1 }, { id: 2 }];
      CampaignService.prototype.getAllCampaigns.mockResolvedValue(campaigns);

      // Act
      await campaignController.getAllCampaigns(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(campaigns);
    });

    it("should return a 500 status and error message when an error occurs", async () => {
      // Arrange
      const errorMessage = "An error occurred";
      CampaignService.prototype.getAllCampaigns.mockRejectedValue(new Error(errorMessage));

      // Act
      await campaignController.getAllCampaigns(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
  describe("getCampaignById", () => {
    it("should return the campaign with the given id", async () => {
      // Arrange
      const campaign = { id: 1, name: "Campaign 1" };
      req.params.id = 1;
      CampaignService.prototype.getCampaignById.mockResolvedValue(campaign);

      // Act
      await campaignController.getCampaignById(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(campaign);
    });

    it("should return a 500 status and error message when an error occurs", async () => {
      // Arrange
      const errorMessage = "An error occurred";
      req.params.id = 1;
      CampaignService.prototype.getCampaignById.mockRejectedValue(new Error(errorMessage));

      // Act
      await campaignController.getCampaignById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe("updateCampaigns", () => {
    it("should update campaigns and return the result", async () => {
      // Arrange
      const result = { message: "Campaigns updated successfully" };
      req.body.key = "someKey";
      CampaignService.prototype.updateCampaigns.mockResolvedValue(result);

      // Act
      await campaignController.updateCampaigns(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(result);
    });

    it("should return a 500 status and error message when an error occurs", async () => {
      // Arrange
      const errorMessage = "An error occurred";
      req.body.key = "someKey";
      CampaignService.prototype.updateCampaigns.mockRejectedValue(new Error(errorMessage));

      // Act
      await campaignController.updateCampaigns(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe("deleteCampaignById", () => {
    it("should delete the campaign with the given id and return a success message", async () => {
      // Arrange
      req.params.id = 1;
      CampaignService.prototype.deleteCampaignById.mockResolvedValue();

      // Act
      await campaignController.deleteCampaignById(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({ message: "Campaign deleted successfully" });
    });

    it("should return a 500 status and error message when an error occurs", async () => {
      // Arrange
      const errorMessage = "An error occurred";
      req.params.id = 1;
      CampaignService.prototype.deleteCampaignById.mockRejectedValue(new Error(errorMessage));

      // Act
      await campaignController.deleteCampaignById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe("postCampaign", () => {
    it("should successfully post a campaign", async () => {
      // Arrange
      const campaignData = { key: "apiKey", domain: "validDomain", name: "New Campaign", type: "Email" };
      const createdCampaign = { id: 1, ...campaignData };
      req.body = campaignData;
      CampaignService.prototype.postCampaign.mockResolvedValue(createdCampaign);

      // Act
      await campaignController.postCampaign(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(createdCampaign);
    });

    it("invalid domain provided", async () => {
      // Arrange
      const campaignData = { key: "apiKey", domain: "invalid domain", name: "New Campaign", type: "Email" };
      const createdCampaign = {
        domain: "This domain is not available for purchase.",
      };
      req.body = campaignData;
      CampaignService.prototype.postCampaign.mockResolvedValue(createdCampaign);

      // Act
      await campaignController.postCampaign(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(createdCampaign);
    });

    it("should return an error response when the service throws an error without response data", async () => {
      // Arrange
      const errorMessage = "Internal server error";
      req.body = {};
      CampaignService.prototype.postCampaign.mockRejectedValue(new Error(errorMessage));

      // Act
      await campaignController.postCampaign(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });

    it("should return an error response when the service throws an error with response data", async () => {
      // Arrange
      const errorResponseData = { error: "Invalid data" };
      req.body = {};
      CampaignService.prototype.postCampaign.mockRejectedValue({ response: { data: errorResponseData } });

      // Act
      await campaignController.postCampaign(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(errorResponseData);
    });
  });

  describe("postDomainLookUp", () => {
    it("should return list of domain suggestions with valid tld", async () => {
      // Arrange
      const domainSuggestions = {
        suggest_list: [
          "uniquedomainnameabc.today",
          "uniquedomainname123reviews.today",
          "uniquedomainname123home.today",
          "uniquedn123.today",
        ],
      };
      req.body = {
        key: "apiKey",
        domain: "uniquedomainname123.com",
        tld: "today",
      };
      CampaignService.prototype.postDomainLookUp.mockResolvedValue(domainSuggestions);

      // Act
      await campaignController.postDomainLookUp(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(domainSuggestions);
    });

    it("should return error with invalid tld", async () => {
      // Arrange
      const response = {
        error: true,
        message: "Please select one of the following tld's: ['today']",
      };
      req.body = {
        key: "apiKey",
        domain: "uniquedomainname123.com",
        tld: "com",
      };
      CampaignService.prototype.postDomainLookUp.mockResolvedValue(response);

      // Act
      await campaignController.postDomainLookUp(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(response);
    });

    it("should return a 500 status and error message when an error occurs", async () => {
      // Arrange
      const errorMessage = "Request failed with status code 500";
      req.body = {};
      CampaignService.prototype.postDomainLookUp.mockRejectedValue(new Error(errorMessage));

      // Act
      await campaignController.postDomainLookUp(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe("postVerifyDomainAvailability", () => {
    it("should successfully verify domain availability", async () => {
      // Arrange
      const requestData = { key: "apiKey", domain: "availableDomain.com" };
      const domainAvailability = { available: true };
      req.body = requestData;
      CampaignService.prototype.postVerifyDomainAvailability.mockResolvedValue(domainAvailability);

      // Act
      await campaignController.postVerifyDomainAvailability(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(domainAvailability);
    });

    it("domain is not available", async () => {
      // Arrange
      const requestData = { key: "apiKey", domain: "unavailableDomain.com" };
      const domainAvailability = { available: false };
      req.body = requestData;
      CampaignService.prototype.postVerifyDomainAvailability.mockResolvedValue(domainAvailability);

      // Act
      await campaignController.postVerifyDomainAvailability(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(domainAvailability);
    });

    it("should return a 500 status and error message when an error occurs without response data", async () => {
      // Arrange
      const errorMessage = "Internal server error";
      req.body = {};
      CampaignService.prototype.postVerifyDomainAvailability.mockRejectedValue(new Error(errorMessage));

      // Act
      await campaignController.postVerifyDomainAvailability(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });

    it("should return a 500 status and error message when an error occurs with response data", async () => {
      // Arrange
      const errorMessage = "Request failed with status code 500";
      req.body = {};
      CampaignService.prototype.postVerifyDomainAvailability.mockRejectedValue(new Error(errorMessage));

      // Act
      await campaignController.postVerifyDomainAvailability(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe("getMetadata", () => {
    it("should successfully retrieve metadata with a valid key", async () => {
      // Arrange
      const validKey = "validApiKey";
      const expectedMetadata = { data: "mockData" };
      req.body = { key: validKey };
      CampaignService.prototype.getMetadata.mockResolvedValue(expectedMetadata);
  
      // Act
      await campaignController.getMetadata(req, res);
  
      // Assert
      expect(res.json).toHaveBeenCalledWith(expectedMetadata);
    });
  
    it("should return a 500 status and error message when an error occurs without response data", async () => {
      // Arrange
      const errorMessage = "Internal server error";
      req.body = { key: "anyKey" };
      CampaignService.prototype.getMetadata.mockRejectedValue(new Error(errorMessage));
  
      // Act
      await campaignController.getMetadata(req, res);
  
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  
    it("should return a 500 status and error message when an error occurs with response data", async () => {
      // Arrange
      const errorMessage = "Request failed with status code 500";
      req.body = { key: "anyKey" };
      CampaignService.prototype.getMetadata.mockRejectedValue(new Error(errorMessage));
  
      // Act
      await campaignController.getMetadata(req, res);
  
      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});
