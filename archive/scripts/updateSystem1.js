require('dotenv').config();
const {updateSystem1Hourly} = require("../services/system1Service");

async function main() {
  return updateSystem1Hourly();
}

main().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error(err);
})
