const Insights = require("../Insights"); // Replace with the actual path to your Insights class file

describe("Insights", () => {
  it("should create an Insights instance with correct properties", () => {
    const insights = new Insights(
      1,
      "2023-09-01",
      1,
      1,
      1000,
      100,
      200,
      10,
      500,
      450,
      12,
      undefined,
      undefined,
      14,
      1,
      "Account1",
      2,
      1,
      "2023-09-01",
      "CampaignName",
      "AdsetName",
      "Google",
      "CRCampName",
    );

    expect(insights).toHaveProperty("id", 1);
    expect(insights).toHaveProperty("date", "2023-09-01");
    expect(insights).toHaveProperty("campaign_id", 1);
    expect(insights).toHaveProperty("ad_id", 1);
    expect(insights).toHaveProperty("total_revenue", 1000);
    expect(insights).toHaveProperty("total_searches", 100);
    expect(insights).toHaveProperty("total_lander_visits", 200);
    expect(insights).toHaveProperty("total_revenue_clicks", 10);
    expect(insights).toHaveProperty("total_visitors", 500);
    expect(insights).toHaveProperty("total_tracked_visitors", 450);
    expect(insights).toHaveProperty("hour_fetched", 12);
    expect(insights).toHaveProperty("created_at");
    expect(insights).toHaveProperty("updated_at");
    expect(insights).toHaveProperty("hour", 14);
    expect(insights).toHaveProperty("pixel_id", 1);
    expect(insights).toHaveProperty("account", "Account1");
    expect(insights).toHaveProperty("adset_id", 2);
    expect(insights).toHaveProperty("crossroads_campaign_id", 1);
    expect(insights).toHaveProperty("request_date", "2023-09-01");
    expect(insights).toHaveProperty("campaign_name", "CampaignName");
    expect(insights).toHaveProperty("adset_name", "AdsetName");
    expect(insights).toHaveProperty("traffic_source", "Google");
    expect(insights).toHaveProperty("cr_camp_name", "CRCampName");
  });
});
