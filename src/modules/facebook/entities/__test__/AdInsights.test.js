const AdInsight = require("../AdInsights");

describe("AdInsight Class", () => {
  test("should correctly instantiate with all arguments", () => {
    const adInsight = new AdInsight(
      "acc123",
      "ad123",
      "adset123",
      "camp123",
      "Campaign1",
      "2023-09-05",
      "14",
      1000,
      50,
      500,
      10,
      "USD",
      5,
      100,
      [{ event: "click" }],
      1,
      "unique123",
    );

    expect(adInsight.ad_account_id).toBe("acc123");
    expect(adInsight.ad_id).toBe("ad123");
    expect(adInsight.adset_id).toBe("adset123");
    expect(adInsight.campaign_id).toBe("camp123");
    expect(adInsight.campaign_name).toBe("Campaign1");
    expect(adInsight.date).toBe("2023-09-05");
    expect(adInsight.hour).toBe("14");
    expect(adInsight.impressions).toBe(1000);
    expect(adInsight.link_clicks).toBe(50);
    expect(adInsight.total_spent).toBe(500);
    expect(adInsight.cpc).toBe(10);
    expect(adInsight.reporting_currency).toBe("USD");
    expect(adInsight.conversions).toBe(5);
    expect(adInsight.clicks).toBe(100);
    expect(adInsight.events).toEqual([{ event: "click" }]);
    expect(adInsight.lead).toBe(1);
    expect(adInsight.unique_identifier).toBe("unique123");
  });
});
