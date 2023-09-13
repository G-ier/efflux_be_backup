const Campaign = require("../Campaign");

describe("Campaign Class", () => {
  test("should correctly instantiate with all arguments", () => {
    const campaign = new Campaign(
      "Campaign1",
      new Date(),
      new Date(),
      1,
      "active",
      "user123",
      "account123",
      "ad_account123",
      1000,
      5000,
      4000,
    );

    expect(campaign.name).toBe("Campaign1");
    expect(campaign.created_time).toEqual(expect.any(Date));
    expect(campaign.updated_time).toEqual(expect.any(Date));
    expect(campaign.traffic_source).toBe("facebook");
    expect(campaign.id).toBe(1);
    expect(campaign.status).toBe("active");
    expect(campaign.user_id).toBe("user123");
    expect(campaign.account_id).toBe("account123");
    expect(campaign.ad_account_id).toBe("ad_account123");
    expect(campaign.daily_budget).toBe(1000);
    expect(campaign.lifetime_budget).toBe(5000);
    expect(campaign.budget_remaining).toBe(4000);
    expect(campaign.network).toBe("unknown");
  });
});
