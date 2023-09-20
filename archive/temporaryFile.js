const FacebookCompositeService    = { CompositeService } = require("../src/modules/facebook/services/CompositeService");
const TiktokCompositeService      = { CompositeService } = require("../src/modules/tiktok/services/CompositeService");
const CrossoradsCompositeService  = { CompositeService } = require("../src/modules/crossroads/services/CompositeService");
const AggregatesService           = require("../src/modules/aggregates/services/AggregatesService");

const main = async (date) => {
  const facebookCompositeService = new FacebookCompositeService();
  await facebookCompositeService.updateFacebookData(date, {
    updatePixels: true,
    updateCampaigns: true,
    updateAdsets: true,
    updateInsights: true,
  });

  const tikTokcompositeService = new TiktokCompositeService();
  await tikTokcompositeService.updateTikTokData(date);

  const crossroadsCompositeService = new CrossoradsCompositeService();
  await crossroadsCompositeService.updateData({
    id: "account-1",
    key: "1a3c3ae4-2755-450d-ac24-8d10371910c5",
  },
  date
  );

  const aggregatesService = new AggregatesService();
  await aggregatesService.updateAggregates("crossroads", "facebook", "2023-09-04", date);
  await aggregatesService.updateAggregates("crossroads", "tiktok", "2023-09-04", date);
  console.log("Done!");
};

main("2023-09-09");
