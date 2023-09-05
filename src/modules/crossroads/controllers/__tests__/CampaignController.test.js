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
  // Similar test cases for getCampaignById, updateCampaigns, and deleteCampaignById
});
