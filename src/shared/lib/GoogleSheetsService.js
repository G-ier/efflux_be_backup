// Third party imports
const { google } = require('googleapis');
const fs = require('fs');

const path = require('path');

// Local imports
const { todayYMDHM } = require('../../shared/helpers/calendar');
const EnvironmentVariablesManager = require('../services/EnvironmentVariablesManager');

class GoogleSheetsService {

  constructor() {
    this.serviceEnabled = false;
    this.KEY_FILE = path.join(process.cwd(), 'cert', 'google.json');
    this.IgnoredColumns = [];
    this.DefaultValues = {
      campaign_id: 'N/A',
      campaign_name: 'N/A',
      adset_id: 'N/A',
      adset_name: 'N/A',
      cr_camp_name: 'N/A',
      s1_camp_name: 'N/A',
    };
    this.init();
  }

  static instance = null;

  static getInstance() {
    if (!GoogleSheetsService.instance) {
      GoogleSheetsService.instance = new GoogleSheetsService();
    }
    return GoogleSheetsService.instance;
  }

  init() {
    let configuration = {
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/spreadsheets.readonly',
      ],
    }

    if (process.env.DEVELOPMENT_ENVIRONMENT === 'true') {
      if (fs.existsSync(this.KEY_FILE)) {
        this.serviceEnabled = true;
        configuration.keyfile = this.KEY_FILE;
      } else {
          throw new Error(`Keyfile is not found at '${this.KEY_FILE}'. Spreadsheet service disabled`);
      }
    } else {
      this.serviceEnabled = true;
      configuration.credentials = EnvironmentVariablesManager.getEnvVariable('GOOGLE_API_KEY_FILE');
    }

    const auth = new google.auth.GoogleAuth(configuration);

    google.options({ auth });
    this.drive = google.drive({ version: 'v3' });
    this.sheets = google.sheets({ version: 'v4' });
  }

  async getSheet(spreadsheetId, options = {}) {
    if (!this.serviceEnabled) {
      console.warn('Spreadsheet service is unavailable');
      return null;
    }
    const { data } = await this.sheets.spreadsheets.get({
      spreadsheetId,
      ...options,
    });
    return data;
  }

  async clearSheet(spreadsheetId, options = {}) {
    if (!this.serviceEnabled) {
      console.warn('Spreadsheet service is unavailable');
      return null;
    }
    await this.sheets.spreadsheets.values.clear({
      spreadsheetId,
      ...options,
    });
  }

  async getSheetValues(spreadsheetId, options = {}) {
    if (!this.serviceEnabled) {
      console.warn('Spreadsheet service is unavailable');
      return null;
    }
    const { data } = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      ...options,
    });
    return data;
  }

  async updateSheetValues(spreadsheetId, values, options) {
    if (!this.serviceEnabled) {
      console.warn('Spreadsheet service is unavailable');
      return null;
    }
    const { data } = await this.sheets.spreadsheets.values.update({
      spreadsheetId,
      requestBody: values,
      valueInputOption: 'USER_ENTERED',
      ...options,
    });
    return data;
  }

  async updateSpreadsheet(
    data,
    options,
    predifeniedRange="",
    include_columns=true,
    add_last_update=true
  ) {
    const { spreadsheetId, sheetName, excludedFields = [] } = options
    const columns = data.columns.filter((col) => this.IgnoredColumns.concat(excludedFields).indexOf(col) === -1)
    let rows;

    if (add_last_update) {
      const now = todayYMDHM();
      rows = data.rows.map((row) => {
        return columns.map((column) => row[column] || this.DefaultValues[column] || 0).concat(now)
      });
      columns.push('last_update');
    } else {
      rows = data.rows.map((row) => columns.map((column) => row[column] || this.DefaultValues[column] || 0));
    }

    let values;
    if (include_columns) {
      const parsedColumns = columns.map((column) => {
        return column.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
      })
      values = [parsedColumns].concat(rows);
    } else{
      values = rows;
    }
    // get spreadsheet meta
    const doc = await this.getSheet(spreadsheetId);
    if (!doc) {
      return
    }

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
    await this.clearSheet(spreadsheetId, {
      range,
    });
    // fill sheet with data
    const body = {
      range,
      values,
      majorDimension: 'ROWS',
    };

    await this.updateSheetValues(spreadsheetId, body, {
      range,
    });
  }

  async mergeSpreadsheet(data, options) {

    const { spreadsheetId, sheetName, excludedFields = [] } = options

    const now = todayYMDHM();
    // Get column names
    const columns = data.fields.map((field) => field.name)
      .filter((col) => this.IgnoredColumns.concat(excludedFields).indexOf(col) === -1);
    // get rows as array of values
    const rows = data.rows.map((row) => columns.map((column) => row[column] || this.DefaultValues[column] || 0).concat(now));

    // get spreadsheet meta
    const doc = await this.getSheet(spreadsheetId);

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

    const { values: sheetValues } = await this.getSheetValues(spreadsheetId, {
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

    const response = await this.updateSheetValues(spreadsheetId, body, {
      range: `${range}!W:AH`,
    });

    console.info('****** Spreadsheet updated ******');
    console.info(`Updated range:   ${response.updatedRange}`);
    console.info(`Updated rows:    ${response.updatedRows}`);
    console.info(`Updated columns: ${response.updatedColumns}`);
    console.info(`Updated cells:   ${response.updatedCells}`);
  }

  async givePermission(drive, spreadsheetId, email) {
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
    } catch (err) {
      throw new Error(`Error sharing spreadsheet with ${email} - ${err}`);
    }
  }

  async createSpreadsheet(title, emails) {
    const resource = {
      properties: {
        title,
      },
    };

    try {
      const response = await this.sheets.spreadsheets.create({
        resource,
        fields: 'spreadsheetId',
      });

      const fileId = response.data.spreadsheetId;

      // Now we will share this spreadsheet with the given emails.
      for (const email of emails) {
        this.givePermission(this.drive, fileId, email)
      }
      return fileId;
    } catch (err) {
      throw new Error(`Error creating spreadsheet - ${err}`);
    }
  }

  async addNewSheet(spreadsheetId, sheetName) {
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
      await this.sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        resource,
      });
    } catch (err) {
      throw new Error(`Error adding new sheet - ${err}`);
    }
  }

  async deleteSpreadsheet(spreadsheetId) {
    if (!this.serviceEnabled) {
      console.warn('Spreadsheet service is unavailable');
      return;
    }
    try {
      await this.drive.files.delete({ fileId: spreadsheetId });
    } catch (error) {
      throw new Error(`Error deleting spreadsheet - ${error}`);
    }
  }

}

module.exports = GoogleSheetsService;

