const _ = require("lodash");
const CompositeService    = require("./src/modules/tiktok/services/CompositeService");

const main = async () => {
  const compositeService = new CompositeService();
  await compositeService.updateTikTokData("2023-08-29")
}

main()
