const AdAccount = require("../AdAccounts");

describe("AdAccount Class", () => {
  test("should correctly instantiate with all arguments", () => {
    const adAccount = new AdAccount(
      "AdAccount1",
      "12345",
      1000,
      500,
      10000,
      "USD",
      "America/Los_Angeles",
      -7,
      "account123",
    );

    expect(adAccount.name).toBe("AdAccount1");
    expect(adAccount.id).toBe("12345");
    expect(adAccount.amount_spent).toBe(1000);
    expect(adAccount.balance).toBe(500);
    expect(adAccount.spend_cap).toBe(10000);
    expect(adAccount.currency).toBe("USD");
    expect(adAccount.timezone_name).toBe("America/Los_Angeles");
    expect(adAccount.timezone_offset_hours_utc).toBe(-7);
    expect(adAccount.account_id).toBe("account123");
  });
});
