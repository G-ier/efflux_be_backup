const UserAccount = require("../UserAccount");

describe("UserAccount Class", () => {
  test("should correctly instantiate with all arguments", () => {
    const userAccount = new UserAccount(
      1,
      "John",
      "john@example.com",
      "http://image.url",
      "provider",
      "12345",
      "active",
      "token123",
      "user123",
      new Date(),
      new Date(),
      "business123",
    );

    expect(userAccount.id).toBe(1);
    expect(userAccount.name).toBe("John");
    expect(userAccount.email).toBe("john@example.com");
    expect(userAccount.image_url).toBe("http://image.url");
    expect(userAccount.provider).toBe("provider");
    expect(userAccount.provider_id).toBe("12345");
    expect(userAccount.status).toBe("active");
    expect(userAccount.token).toBe("token123");
    expect(userAccount.user_id).toBe("user123");
    expect(userAccount.created_at).toEqual(expect.any(Date));
    expect(userAccount.updated_at).toEqual(expect.any(Date));
    expect(userAccount.business_scoped_id).toBe("business123");
  });

  test("should correctly apply default values", () => {
    const userAccount = new UserAccount(1, "John", "john@example.com");

    expect(userAccount.image_url).toBe("");
    expect(userAccount.provider).toBe("unknown");
    expect(userAccount.business_scoped_id).toBe("");
  });
});
