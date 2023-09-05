const _ = require("lodash");
const DatabaseRepository = require("../../../../shared/lib/DatabaseRepository");
const Campaign = require("../../entities/Campaign");
const CampaignRepository = require("../CampaignRepository"); // Adjust the path

jest.mock("../../../../shared/lib/DatabaseRepository");
jest.mock("../../entities/Campaign");

describe("CampaignRepository", () => {
  let campaignRepository;
  let mockDatabaseInstance;
  let mockCampaignInstance;

  beforeEach(() => {
    mockDatabaseInstance = new DatabaseRepository();
    mockCampaignInstance = new Campaign();
    campaignRepository = new CampaignRepository(mockDatabaseInstance);
  });

  describe("saveOne", () => {
    it("should save a campaign successfully", async () => {
      // Arrange
      mockDatabaseInstance.insert.mockResolvedValue(true);

      // Act
      const result = await campaignRepository.saveOne(mockCampaignInstance);

      // Assert
      expect(result).toBe(true);
      expect(mockDatabaseInstance.insert).toHaveBeenCalledWith("crossroads_campaigns", expect.any(Object));
    });

    it("should handle errors correctly", async () => {
      // Arrange
      const error = new Error("Database error");
      mockDatabaseInstance.insert.mockRejectedValue(error);

      // Act and Assert
      await expect(campaignRepository.saveOne(mockCampaignInstance)).rejects.toThrow(error);
    });
  });

  describe("toDomainEntity", () => {
    it("should convert a database object to a Campaign object correctly", () => {
      // Arrange
      const dbObject = {
        id: 1,
        name: "Test",
        type: "Type1",
        user_id: 1,
        account_id: 1,
        created_at: new Date(),
        updated_at: new Date(),
      };

      // Act
      const result = campaignRepository.toDomainEntity(dbObject);

      // Assert
      expect(result).toBeInstanceOf(Campaign);
      expect(result).toEqual(expect.any(Campaign));
    });
  });
});
