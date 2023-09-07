const Pixel = require("../Pixel");

describe("Pixel Class", () => {
  test("should correctly instantiate with all arguments", () => {
    const pixel = new Pixel(
      1,
      "user123",
      "account123",
      "Pixel1",
      "business123",
      "BusinessName",
      false,
      new Date(),
      new Date(),
      "ALL_EVENTS",
      "pixel_ad_account123",
    );

    expect(pixel.id).toBe(1);
    expect(pixel.user_id).toBe("user123");
    expect(pixel.account_id).toBe("account123");
    expect(pixel.name).toBe("Pixel1");
    expect(pixel.business_id).toBe("business123");
    expect(pixel.business_name).toBe("BusinessName");
    expect(pixel.is_unavailable).toBe(false);
    expect(pixel.last_fired_time).toEqual(expect.any(Date));
    expect(pixel.creation_time).toEqual(expect.any(Date));
    expect(pixel.data_use_setting).toBe("ALL_EVENTS");
    expect(pixel.pixel_id_ad_account_id).toBe("pixel_ad_account123");
  });
});
