const { google } = require('googleapis');
const fs = require('fs');
const {todayYMDHM} = require('../common/day');

let serviceEnabled = false;
const KEY_FILE = './cert/google.json';
const IgnoredColumns = [];
const DefaultValues = {
  campaign_id: 'N/A',
  campaign_name: 'N/A',
  adset_id: 'N/A',
  adset_name: 'N/A',
  cr_camp_name: 'N/A',
  s1_camp_name: 'N/A',
};

fs.access(KEY_FILE, (err) => {
  if (err) {
    console.warn(`Keyfile is not found at '${KEY_FILE}'. Spreadsheet service disabled`);
    return;
  }
  serviceEnabled = true;
});

const auth = new google.auth.GoogleAuth({
  keyFile: KEY_FILE,
  scopes: [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
  ],
});

google.options({ auth });
const sheets = google.sheets({ version: 'v4' });

async function getSheet(spreadsheetId, options = {}) {
  if (!serviceEnabled) {
    console.warn('Spreadsheet service is unavailable');
    return null;
  }
  const { data } = await sheets.spreadsheets.get({
    spreadsheetId,
    ...options,
  });
  return data;
}

async function clearSheet(spreadsheetId, options = {}) {
  if (!serviceEnabled) {
    console.warn('Spreadsheet service is unavailable');
    return null;
  }
  const { data } = await sheets.spreadsheets.values.clear({
    spreadsheetId,
    ...options,
  });
}

async function getSheetValues(spreadsheetId, options = {}) {
  if (!serviceEnabled) {
    console.warn('Spreadsheet service is unavailable');
    return null;
  }
  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId,
    ...options,
  });
  return data;
}

async function updateSheetValues(spreadsheetId, values, options) {
  if (!serviceEnabled) {
    console.warn('Spreadsheet service is unavailable');
    return null;
  }
  const { data } = await sheets.spreadsheets.values.update({
    spreadsheetId,
    requestBody: values,
    valueInputOption: 'USER_ENTERED',
    ...options,
  });
  return data;
}

async function updateSpreadsheet(data, options, predifeniedRange="", include_columns=true, add_last_update=true) {
  const { spreadsheetId, sheetName, excludedFields = [] } = options

  // Get column names
  const columns = data.columns.filter((col) => IgnoredColumns.concat(excludedFields).indexOf(col) === -1)

  // get rows as array of values
  let rows;
  // add last update column & values
  if (add_last_update) {
    const now = todayYMDHM();
    rows = data.rows.map((row) => columns.map((column) => row[column] || DefaultValues[column] || 0).concat(now));
    columns.push('last_update');
  } else {
    rows = data.rows.map((row) => columns.map((column) => row[column] || DefaultValues[column] || 0));
  }

  console.log("Columns", columns)
  console.log("Rows Sample",rows[0])

  let values;

  if (include_columns) {
    const parsedColumns = columns.map((column) => {
      return column.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
    })
    console.log("Parsed Columns", parsedColumns)
    values = [parsedColumns].concat(rows);
  } else{
    values = rows;
  }
  // get spreadsheet meta
  const doc = await getSheet(spreadsheetId);

  // find target sheet
  let sheet;
  if (sheetName) {
    sheet = doc.sheets.find((item) => item.properties.title === sheetName);
  } else {
    sheet = doc.sheets.find((item) => item.properties.index === 0);
  }

  if (!sheet) {
    throw new Error(`Sheet ${sheetName} not found`);
  }

  const range = sheet.properties.title + predifeniedRange;

  // clear sheet
  await clearSheet(spreadsheetId, {
    range,
  });

  // fill sheet with data
  const body = {
    range,
    values,
    majorDimension: 'ROWS',
  };

  const response = await updateSheetValues(spreadsheetId, body, {
    range,
  });

  console.info('****** Spreadsheet updated ******');
  console.info(`Updated range:   ${response.updatedRange}`);
  console.info(`Updated rows:    ${response.updatedRows}`);
  console.info(`Updated columns: ${response.updatedColumns}`);
  console.info(`Updated cells:   ${response.updatedCells}`);
}

async function mergeSpreadsheet(data, options) {
  const { spreadsheetId, sheetName, excludedFields = [] } = options
  const now = todayYMDHM();
  // Get column names
  const columns = data.fields.map((field) => field.name)
    .filter((col) => IgnoredColumns.concat(excludedFields).indexOf(col) === -1);
  // get rows as array of values
  const rows = data.rows.map((row) => columns.map((column) => row[column] || DefaultValues[column] || 0).concat(now));

  // get spreadsheet meta
  const doc = await getSheet(spreadsheetId);

  // find target sheet
  let sheet;
  if (sheetName) {
    sheet = doc.sheets.find((item) => item.properties.title === sheetName);
  } else {
    sheet = doc.sheets.find((item) => item.properties.index === 0);
  }

  if (!sheet) {
    throw new Error(`Sheet ${sheetName} not found`);
  }

  const range = sheet.properties.title;

  const { values: sheetValues } = await getSheetValues(spreadsheetId, {
    range
  });
  const updatedRows = sheetValues.map((row) => {
    return rows.filter(record => record[0] == row[3])[0]?.slice(1) || []
  })

  // add last_update column
  columns.push('last_update');
  updatedRows[0] = columns.slice(1);
  updatedRows[1] = [];
  // const newRows = rows.filter(el=> !(sheetValues.map(row => row[3]).includes(el[0])));
  // const newFormattedRows = newRows.map(row => [...row, row[0]].slice(1))
  // fill sheet with data
  const body = {
    range: `${range}!W:AH`,
    values: updatedRows,
    majorDimension: 'ROWS',
  };

  const response = await updateSheetValues(spreadsheetId, body, {
    range: `${range}!W:AH`,
  });

  console.info('****** Spreadsheet updated ******');
  console.info(`Updated range:   ${response.updatedRange}`);
  console.info(`Updated rows:    ${response.updatedRows}`);
  console.info(`Updated columns: ${response.updatedColumns}`);
  console.info(`Updated cells:   ${response.updatedCells}`);
}

async function givePermission(drive, spreadsheetId, email) {
  try {
    await drive.permissions.create({
      resource: {
        type: 'user',
        role: 'writer',
        emailAddress: email,
      },
      fileId: spreadsheetId,
      fields: 'id',
    });
    console.log(`Spreadsheet shared with ${email}`);
  } catch (err) {
    console.log(err);
  }
}

async function createSpreadsheet(title, emails) {

  const drive = google.drive({version: 'v3', auth});
  const resource = {
    properties: {
      title,
    },
  };

  try {
    const response = await sheets.spreadsheets.create({
      resource,
      fields: 'spreadsheetId',
    });

    const fileId = response.data.spreadsheetId;
    console.log(`Spreadsheet ID: ${fileId}`);

    // Now we will share this spreadsheet with the given emails.
    for (const email of emails) {
      givePermission(drive, fileId, email)
    }
    return fileId;
  } catch (err) {
    console.log(err);
    return null;
  }
}

async function addNewSheet(spreadsheetId, sheetName) {
  const resource = {
    requests: [
      {
        addSheet: {
          properties: {
            title: sheetName,
          },
        },
      },
    ],
  };

  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      resource,
    });
    console.log(`Sheet ${sheetName} added`);
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  getSheet,
  getSheetValues,
  updateSheetValues,
  clearSheet,
  updateSpreadsheet,
  mergeSpreadsheet,
  createSpreadsheet,
  addNewSheet
};
