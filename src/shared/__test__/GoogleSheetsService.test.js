const GoogleSheetsService = require('../lib/GoogleSheetsService'); // Adjust this path

describe('GoogleSheetsService', () => {
  let serviceInstance;
  let createdSpreadsheetId;

  beforeAll(() => {
    serviceInstance = GoogleSheetsService.getInstance();
  });

  it('should create a new spreadsheet', async () => {
    let spreadsheetId = await serviceInstance.createSpreadsheet("TestSpreadsheet", ["deni@roi.ad"]);

    expect(spreadsheetId).toBeDefined();
    createdSpreadsheetId = spreadsheetId;
  });

  it('should retrieve the spreadsheet data', async () => {
    const sheetData = await serviceInstance.getSheet(createdSpreadsheetId);
    expect(sheetData).toBeDefined();
    expect(sheetData.spreadsheetId).toBe(createdSpreadsheetId);
  });

  it('should retrieve empty values from the new spreadsheet', async () => {
    const sheetValues = await serviceInstance.getSheetValues(createdSpreadsheetId, {range: 'Sheet1'});
    expect(sheetValues).toBeDefined();
    expect(sheetValues.range).toEqual('Sheet1!A1:Z1000');
    expect(sheetValues.values).toEqual(undefined); // Assuming a new sheet will be empty
  });

  it('should update the spreadsheet with some values', async () => {
    const data = {
      columns: ['name', 'age'],
      rows: [
        { name: 'Alice', age: '25' },
        { name: 'Bob', age: '30' }
      ]
    };
    const options = {
      spreadsheetId: createdSpreadsheetId,
      sheetName: 'Sheet1' // Assuming the default name
    };
    await serviceInstance.updateSpreadsheet(data, options);
    const updatedSheetValues = await serviceInstance.getSheetValues(createdSpreadsheetId, {range: 'Sheet1'});
    expect(updatedSheetValues).toBeDefined();
    expect(updatedSheetValues.values).toEqual([
      ['Name', 'Age', 'Last Update'],
      ['Alice', '25', expect.any(String)],
      ['Bob', '30', expect.any(String)]
    ]);
  });

  it('should clear the spreadsheet', async () => {
    await serviceInstance.clearSheet(createdSpreadsheetId, { range: 'Sheet1' });
    const clearedSheetValues = await serviceInstance.getSheetValues(createdSpreadsheetId, {range: 'Sheet1'});
    expect(clearedSheetValues).toBeDefined();
    expect(clearedSheetValues.range).toEqual('Sheet1!A1:Z1000');
    expect(clearedSheetValues.values).toEqual(undefined); // Assuming a new sheet will be empty
  });

  it('should add a new sheet', async () => {
    await serviceInstance.addNewSheet(createdSpreadsheetId, 'Sheet2');
    const sheetData = await serviceInstance.getSheet(createdSpreadsheetId, { ranges: 'Sheet2' });
    expect(sheetData).toBeDefined();
    expect(sheetData.sheets[0].properties.title).toEqual('Sheet2');
  });

  afterAll(async () => {
    // Cleanup: Optionally delete the created spreadsheet after all tests
    // This is just an example. You'd need to add a deleteSpreadsheet method to your class.
    await serviceInstance.deleteSpreadsheet(createdSpreadsheetId);
  });

});

