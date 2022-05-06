const GSheets = require("g-sheets-api");

const fetchFacebookReportFromGSheets = () => {
  const sheetsOptions = {
    sheetId: "1_lZVgVlFm_iKqoWVFqaFt8mZB7A8QGTcDGe6dW5a5VY",
    sheetNumber: 1,
  };
  GSheets(
    sheetsOptions,
    (res) => {
      return res;
    },
    (err) => {
      return err;
    }
  );
};

module.exports = {
  fetchFacebookReportFromGSheets,
};
