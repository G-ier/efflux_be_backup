const CompositeService = require("../../services/ConpositeService"); // adjust the path as necessary
const CompositeController = require("../CompositeController"); // adjust the path as necessary

jest.mock("../../services/ConpositeService");

describe("CompositeController", () => {
  let req;
  let res;
  let compositeController;

  beforeEach(() => {
    // Mock request and response objects
    req = {
      body: {},
    };
    res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };

    // Instantiate the controller with the mocked service
    compositeController = new CompositeController();

    consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  describe("updateData", () => {
    it("should update data and return a success message", async () => {
      // Arrange
      req.body = { account: "12345", request_date: "2023-09-01" };
      CompositeService.prototype.updateData.mockResolvedValue();

      // Act
      await compositeController.updateData(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Data updated successfully." });
    });

    it("should return a 500 status and error message when an error occurs", async () => {
      // Arrange
      const errorMessage = "An error occurred";
      req.body = { account: "12345", request_date: "2023-09-01" };
      CompositeService.prototype.updateData.mockRejectedValue(new Error(errorMessage));

      // Act
      await compositeController.updateData(req, res);

      // Assert
      expect(console.error).toHaveBeenCalledWith("Error updating data: ", new Error(errorMessage));
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: "Error updating data.", error: errorMessage });
    });
  });
});
