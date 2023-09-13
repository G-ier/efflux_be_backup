const Adset = require("../Adset");

describe("Adset Class", () => {
  test("should correctly instantiate with all arguments", () => {
    const adset = new Adset(
      "Adset1",
      new Date(),
      new Date(),
      "provider123",
      "active",
      1,
      "user123",
      "account123",
      "ad_account123",
      1000,
      5000,
      4000,
    );

    expect(adset.name).toBe("Adset1");
    expect(adset.created_time).toEqual(expect.any(Date));
    expect(adset.updated_time).toEqual(expect.any(Date));
    expect(adset.traffic_source).toBe("facebook");
    expect(adset.provider_id).toBe("provider123");
    expect(adset.status).toBe("active");
    expect(adset.campaign_id).toBe(1);
    expect(adset.user_id).toBe("user123");
    expect(adset.account_id).toBe("account123");
    expect(adset.ad_account_id).toBe("ad_account123");
    expect(adset.daily_budget).toBe(1000);
    expect(adset.lifetime_budget).toBe(5000);
    expect(adset.budget_remaining).toBe(4000);
    expect(adset.network).toBe("unknown");
  });
});
