const Campaign = require("../Campaign"); // Replace with the actual path to your Campaign class file

describe("Campaign", () => {
  it("should create a Campaign instance with correct properties", () => {
    const campaign = new Campaign(1, "Campaign1", "Type1", 1, 1);

    expect(campaign).toHaveProperty("id", 1);
    expect(campaign).toHaveProperty("name", "Campaign1");
    expect(campaign).toHaveProperty("type", "Type1");
    expect(campaign).toHaveProperty("user_id", 1);
    expect(campaign).toHaveProperty("account_id", 1);
    expect(campaign).toHaveProperty("created_at");
    expect(campaign).toHaveProperty("updated_at");
  });
});
