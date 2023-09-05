const InsightsRepository = require("../InsightsRepository"); // adjust the path as necessary
const DatabaseRepository = require("../../../../shared/lib/DatabaseRepository");
const Insights = require("../../entities/Insights");
const _ = require("lodash");

jest.mock("../../../../shared/lib/DatabaseRepository");

describe("InsightsRepository", () => {
  let databaseRepository;
  let insightsRepository;

  beforeEach(() => {
    databaseRepository = new DatabaseRepository();
    insightsRepository = new InsightsRepository(databaseRepository);
  });

  describe("saveOne", () => {
    it("should save one insight to both tables", async () => {
      // Arrange
      const insight = { id: 1, revenue: 100 };
      const dbObject = { id: 1, revenue: 100 /* ... other transformed properties */ };
      insightsRepository.toDatabaseDTO = jest.fn().mockReturnValue(dbObject);
      databaseRepository.insert = jest.fn().mockResolvedValue(true);

      // Act
      const result = await insightsRepository.saveOne(insight);

      // Assert
      expect(insightsRepository.toDatabaseDTO).toHaveBeenCalledWith(insight);
      expect(databaseRepository.insert).toHaveBeenCalledWith("crossroads", dbObject);
      expect(databaseRepository.insert).toHaveBeenCalledWith("crossroads_partitioned", dbObject);
      expect(result).toBe(true);
    });
  });

  describe("update", () => {
    it("should update data in both tables", async () => {
      // Arrange
      const data = { revenue: 300 };
      const criteria = { id: 1 };
      databaseRepository.update = jest.fn().mockResolvedValue(true);

      // Act
      const result = await insightsRepository.update(data, criteria);

      // Assert
      expect(databaseRepository.update).toHaveBeenCalledWith("crossroads", data, criteria);
      expect(databaseRepository.update).toHaveBeenCalledWith("crossroads_partitioned", data, criteria);
      expect(result).toBe(true);
    });
  });

  describe("delete", () => {
    it("should delete data from both tables", async () => {
      // Arrange
      const criteria = { id: 1 };
      databaseRepository.delete = jest.fn().mockResolvedValue(true);

      // Act
      const result = await insightsRepository.delete(criteria);

      // Assert
      expect(databaseRepository.delete).toHaveBeenCalledWith("crossroads", criteria);
      expect(databaseRepository.delete).toHaveBeenCalledWith("crossroads_partitioned", criteria);
      expect(result).toBe(true);
    });
  });

  describe("upsert", () => {
    it("should upsert data into the main table", async () => {
      // Arrange
      const insights = [{ id: 1, revenue: 100 }];
      const id = 1;
      const request_date = "2023-09-01";
      const dbObjects = [{ id: 1, revenue: 100 /* ... other transformed properties */ }];
      insightsRepository.toDatabaseDTO = jest.fn().mockReturnValue(dbObjects);
      databaseRepository.upsert = jest.fn().mockResolvedValue(true);

      // Act
      await insightsRepository.upsert(insights, id, request_date);

      // Assert
      expect(insightsRepository.toDatabaseDTO).toHaveBeenCalledWith(insights, id, request_date);
      expect(databaseRepository.upsert).toHaveBeenCalledWith("crossroads", dbObjects, "id");
    });
  });

  describe("fetchInsights", () => {
    it("should fetch insights from the database and transform to domain entities", async () => {
      // Arrange
      const fields = ["*"];
      const filters = {};
      const limit = 10;
      const dbObjects = [
        { id: 1, revenue: 100 /* ... other properties */ },
        { id: 2, revenue: 200 /* ... other properties */ },
      ];
      databaseRepository.query = jest.fn().mockResolvedValue(dbObjects);
      insightsRepository.toDomainEntity = jest.fn((dbObject) => new Insights(dbObject));

      // Act
      const results = await insightsRepository.fetchInsights(fields, filters, limit);

      // Assert
      expect(databaseRepository.query).toHaveBeenCalledWith("crossroads_partitioned", fields, filters, limit);
      expect(results).toHaveLength(2);
      expect(results[0]).toBeInstanceOf(Insights);
      expect(results[1]).toBeInstanceOf(Insights);
    });
  });
});
