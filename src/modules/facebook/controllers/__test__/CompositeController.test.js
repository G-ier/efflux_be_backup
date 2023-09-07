const CompositeService = require("../../services/CompositeService");
const CompositeController = require("../CompositeController");

jest.mock("../../services/CompositeService");
describe("CompositeController", () => {
  let req;
  let res;
  let compositeController;

  beforeEach(() => {
    // Mock request and response objects
    req = {
      params: {},
      body: {},
      query: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res),
      send: jest.fn(() => res),
    };

    // Instantiate the controller with the mocked service
    compositeController = new CompositeController();
  });

  describe("updateEntity", () => {
    it("should update entity and return the result", async () => {
      // Arrange
      const updatedEntity = { message: "Entity updated successfully" };
      req.query = { entityId: "123", status: "active", dailyBudget: 500, type: "campaign" };
      CompositeService.prototype.updateEntity.mockResolvedValue(updatedEntity);

      // Act
      await compositeController.updateEntity(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ updated: updatedEntity });
    });

    it("should return a 500 status and error message when an error occurs", async () => {
      // Arrange
      const errorMessage = "An error occurred";
      req.query = { entityId: "123", status: "active", dailyBudget: 500, type: "campaign" };
      CompositeService.prototype.updateEntity.mockRejectedValue(new Error(errorMessage));

      // Act
      await compositeController.updateEntity(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });

  describe("duplicateEntity", () => {
    it("should duplicate entity and return the result", async () => {
      // Arrange
      const duplicateResult = { message: "Entity duplicated successfully" };
      req.body = { type: "campaign", deep_copy: true, status_option: "active", rename_options: {}, entity_id: "123" };
      CompositeService.prototype.duplicateEntity.mockResolvedValue(duplicateResult);

      // Act
      await compositeController.duplicateEntity(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(duplicateResult);
    });

    it("should return a 500 status and error message when an error occurs", async () => {
      // Arrange
      const errorMessage = "An error occurred";
      req.body = { type: "campaign", deep_copy: true, status_option: "active", rename_options: {}, entity_id: "123" };
      CompositeService.prototype.duplicateEntity.mockRejectedValue(new Error(errorMessage));

      // Act
      await compositeController.duplicateEntity(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: errorMessage });
    });
  });
});
