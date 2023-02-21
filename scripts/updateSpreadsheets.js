require('dotenv').config();
const spreadsheetController = require('../controllers/spreadsheetController');

async function main() {
  // await spreadsheetController.updateCR_Spreadsheet()
  await spreadsheetController.updateCR_ThreeDaySpreadsheet()
  // await spreadsheetController.updateS1_Spreadsheet()
  // await spreadsheetController.updateOB_Spreadsheet()
  // await spreadsheetController.updatePR_Spreadsheet()
}

main().then(() => {
  process.exit(0);
}).catch((err) => {
  console.error(err);
})
