const axios = require("axios");
const { ServiceUnavailable } = require("http-errors");
const AdAccountService = require("../AdAccountService");
const AdAccountRepository = require("../../repositories/AdAccountRepository");
const { sendSlackNotification } = require("../../../../shared/lib/SlackNotificationService");

jest.mock("axios");
jest.mock("../../repositories/AdAccountRepository");
jest.mock("../../../../shared/lib/SlackNotificationService");

describe("AdAccountService", () => {
  let adAccountService;

  beforeEach(() => {
    adAccountService = new AdAccountService();
  });

  describe("getAdAccountFromApi", () => {
    it("should return account data from API", async () => {
      axios.get.mockResolvedValue({ data: "account_data" });

      const result = await adAccountService.getAdAccountFromApi("12345", "token123");

      expect(result).toBe("account_data");
    });

    it("should throw ServiceUnavailable error on API error", async () => {
      axios.get.mockRejectedValue({ response: { data: { error: "API error" } } });

      await expect(adAccountService.getAdAccountFromApi("12345", "token123")).rejects.toThrow(ServiceUnavailable);
    });
  });

  describe("getAdAccountsFromApi", () => {
    it("should return accounts data from API", async () => {
      axios.get.mockResolvedValue({ data: { data: "accounts_data" } });

      const result = await adAccountService.getAdAccountsFromApi("user123", "token123");

      expect(result).toBe("accounts_data");
    });
  });
  describe("syncAdAccounts", () => {
    it("should sync API ad accounts to database", async () => {
      adAccountService.getAdAccountsFromApi = jest.fn().mockResolvedValue([{ id: "account1" }, { id: "account2" }]);
      AdAccountRepository.prototype.upsert = jest.fn().mockResolvedValue();

      const result = await adAccountService.syncAdAccounts("provider123", "user123", "account123", "token123");

      expect(result).toEqual(["account1", "account2"]);
    });
  });
});
