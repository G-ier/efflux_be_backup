const AdCreative = require("../AdCreatives");

describe("AdCreative Class", () => {
  test("should correctly instantiate with all arguments", () => {
    const adCreative = new AdCreative(
      1,
      "Creative1",
      "Description",
      "image",
      "http://media.url",
      "Click Here",
      1,
      1,
      new Date(),
      new Date(),
    );

    expect(adCreative.id).toBe(1);
    expect(adCreative.name).toBe("Creative1");
    expect(adCreative.description).toBe("Description");
    expect(adCreative.media_type).toBe("image");
    expect(adCreative.media_url).toBe("http://media.url");
    expect(adCreative.call_to_action).toBe("Click Here");
    expect(adCreative.campaign_id).toBe(1);
    expect(adCreative.adset_id).toBe(1);
    expect(adCreative.created_at).toEqual(expect.any(Date));
    expect(adCreative.updated_at).toEqual(expect.any(Date));
  });
});
