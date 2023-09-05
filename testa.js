// // // Local application imports
// // const CompositeService = require('./src/modules/facebook/services/CompositeService');

const CompositeService = require("./src/modules/crossroads/services/ConpositeService");
const InsightsService = require("./src/modules/crossroads/services/InsightsService");

// // const main = async () => {
// //   const compositeService = new CompositeService();
// //   await compositeService.updateFacebookData("2023-08-29")
// // }

// // main()

// const { updateCrossroadsData } = require("./services/crossroadsService");

// const InsightsService = require("./src/modules/crossroads/services/InsightsService");

// const { updateInsightsOnDatabase } = require("./controllers/insightsController");
// const { ruleThemAllQuery } = require("./services/insightsService");
// const main = async () => {
//   const account = {
//     id: "account-1",
//     key: "1a3c3ae4-2755-450d-ac24-8d10371910c5",
//   };
//   const network = "crossroads";
//   const trafficSource = "tiktok";
//   const { rows } = await ruleThemAllQuery(network, trafficSource, "2023-08-31", "2023-09-01");
//   await updateInsightsOnDatabase(rows, trafficSource);
//   // const compositeService = new InsightsService();
//   // await updateInsightsOnDatabase("2023-09-01", "tiktok");
//   console.log("ALL DONE");
// };

// main();

const main = async () => {
  const service = new CompositeService();
  const account = {
    id: "account-1",
    key: "1a3c3ae4-2755-450d-ac24-8d10371910c5",
  };
  await service.updateData(account, "2023-09-01");
  console.log("DONE");
};

main();
