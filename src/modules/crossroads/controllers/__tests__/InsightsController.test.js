const InsightsService = require("../../services/InsightsService");
const InsightsController = require("../InsightsController");

jest.mock("../../services/InsightsService");

describe("InsightsController", () => {
  let req;
  let res;
  let insightsController;

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
    insightsController = new InsightsController();
  });

  describe("updateCrossroadsData", () => {
    it("should update crossroads data and return a success message", async () => {
      // Arrange
      req.body = { account: "12345", request_date: "2023-09-01" };
      InsightsService.prototype.updateCrossroadsData.mockResolvedValue();

      // Act
      await insightsController.updateCrossroadsData(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({ message: "Crossroads data updated successfully." });
    });

    it("should return a 500 status and error message when an error occurs", async () => {
      // Arrange
      const errorMessage = "An error occurred";
      req.body = { account: "12345", request_date: "2023-09-01" };
      InsightsService.prototype.updateCrossroadsData.mockRejectedValue(new Error(errorMessage));

      // Act
      await insightsController.updateCrossroadsData(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe("getCrossroadsById", () => {
    it("should return the crossroads data with the given id", async () => {
      // Arrange
      const crossroads = { id: 1, name: "Crossroads 1" };
      req.params.id = 1;
      InsightsService.prototype.getCrossroadsById.mockResolvedValue(crossroads);

      // Act
      await insightsController.getCrossroadsById(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(crossroads);
    });

    it("should return a 500 status and error message when an error occurs", async () => {
      // Arrange
      const errorMessage = "An error occurred";
      req.params.id = 1;
      InsightsService.prototype.getCrossroadsById.mockRejectedValue(new Error(errorMessage));

      // Act
      await insightsController.getCrossroadsById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe("getAllCrossroads", () => {
    it("should return all crossroads data", async () => {
      // Arrange
      const allCrossroads = [{ id: 1 }, { id: 2 }];
      InsightsService.prototype.getAllCrossroads.mockResolvedValue(allCrossroads);

      // Act
      await insightsController.getAllCrossroads(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith(allCrossroads);
    });

    it("should return a 500 status and error message when an error occurs", async () => {
      // Arrange
      const errorMessage = "An error occurred";
      InsightsService.prototype.getAllCrossroads.mockRejectedValue(new Error(errorMessage));

      // Act
      await insightsController.getAllCrossroads(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });

  describe("deleteCrossroadsById", () => {
    it("should delete the crossroads data with the given id and return a success message", async () => {
      // Arrange
      req.params.id = 1;
      InsightsService.prototype.deleteCrossroadsById.mockResolvedValue();

      // Act
      await insightsController.deleteCrossroadsById(req, res);

      // Assert
      expect(res.json).toHaveBeenCalledWith({ message: "Crossroads deleted successfully." });
    });

    it("should return a 500 status and error message when an error occurs", async () => {
      // Arrange
      const errorMessage = "An error occurred";
      req.params.id = 1;
      InsightsService.prototype.deleteCrossroadsById.mockRejectedValue(new Error(errorMessage));

      // Act
      await insightsController.deleteCrossroadsById(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
    });
  });
});
