const axios = require("axios");
const CampaignService = require("../CampaignService");

jest.mock("axios");

describe("CampaignService", () => {
  let campaignService;

  beforeEach(() => {
    campaignService = new CampaignService();
  });

  describe("postCampaign", () => {
    it("should return campaign data after successful post", async () => {
      const responseBody = { data: "campaign_data" };
      axios.post.mockResolvedValue(responseBody);
      const body = { key: "apiKey", additionalData: "data" };

      const result = await campaignService.postCampaign(body);

      expect(result).toBe("campaign_data");
    });

    it("should throw an error on API error", async () => {
      axios.post.mockRejectedValue(new Error("API error"));

      const body = { key: "apiKey", additionalData: "data" };

      await expect(campaignService.postCampaign(body)).rejects.toThrow("API error");
    });
  });

  describe("postDomainLookUp", () => {
    it("should return domain lookup data after successful post", async () => {
      const responseBody = { data: "domain_lookup_data" };
      axios.post.mockResolvedValue(responseBody);

      const result = await campaignService.postDomainLookUp("apiKey", "example", "com");

      expect(result).toBe("domain_lookup_data");
    });

    it("should throw an error on API error", async () => {
      axios.post.mockRejectedValue(new Error("API error"));

      await expect(campaignService.postDomainLookUp("apiKey", "example", "com")).rejects.toThrow("API error");
    });
  });

  describe("postVerifyDomainAvailability", () => {
    it("should return domain availability data after successful post", async () => {
      const responseBody = { data: "domain_availability_data" };
      axios.post.mockResolvedValue(responseBody);

      const result = await campaignService.postVerifyDomainAvailability("apiKey", "example.com");

      expect(result).toBe("domain_availability_data");
    });

    it("should throw an error on API error", async () => {
      axios.post.mockRejectedValue(new Error("API error"));

      await expect(campaignService.postVerifyDomainAvailability("apiKey", "example.com")).rejects.toThrow("API error");
    });
  });

  describe("getMetadata", () => {
    it("should return metadata data after successful get", async () => {
      const responseBody = { data: "metadata_data" };
      axios.get.mockResolvedValue(responseBody);

      const result = await campaignService.getMetadata("apiKey");

      expect(result).toBe("metadata_data");
    });

    it("should throw an error on API error", async () => {
      axios.get.mockRejectedValue(new Error("API error"));

      await expect(campaignService.getMetadata("apiKey")).rejects.toThrow("API error");
    });
  });
});
