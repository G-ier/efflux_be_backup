require('dotenv').config();
const { updateOutbrainData } = require('../controllers/outbrainController');

async function main() {
  return updateOutbrainData();
}

main().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error(err);
})
