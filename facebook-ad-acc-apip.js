const graph = require('fbgraph');
const { google } = require("googleapis");
require('dotenv').config();
const fs = require('fs');
const util = require('util');
const log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
const log_stdout = process.stdout;

const access_token = process.env.FB_AccessToken;
let countAccount = 0;
const auth = new google.auth.GoogleAuth({
  keyFile: "keys.json", //the key file
  //url to spreadsheets API
  scopes: "https://www.googleapis.com/auth/spreadsheets",
});

graph.setAccessToken(access_token);
graph.setVersion("14.0");

async function init(preRowNum) {
  //Auth client Object
  const authClientObject = await auth.getClient();

  //Google sheets instance
  const googleSheetsInstance = google.sheets({ version: "v4", auth: authClientObject });

  // spreadsheet id
  const spreadsheetId = process.env.spreadsheetId
  const today = new Date();
  googleSheetsInstance.spreadsheets.values.update({
    auth,
    spreadsheetId,
    range: `Active Accounts!A:Z`,
    valueInputOption: "USER_ENTERED",
    resource: {
      values: [["", "Ad Account name","Ad Account ID", "Time Zone", "Currency",  "Maximum Spent", "Account Limit spent", "Today Spent", "Remaining Balance", "DateTime"]],
    },
  });

  graph.get("me/adaccounts?limit=5000", async function(err, res) {
    try {
      console.log('accounts', res.data)
    let maximumSpent = 0, accountLimitSpent = 0, todaySpent = 0, remainingBalance = 0;
    let rowNum = 2;
    for(let i = 0; i < res.data?.length; i++){
      if(res.data[i].id == "act_658091222286749") continue;
      const rowData = await getRowData(res.data[i].id);
      //write data into the google sheets
      maximumSpent += parseFloat(rowData[5]);
      accountLimitSpent += parseFloat(rowData[6]);
      todaySpent += parseFloat(rowData[7]);
      remainingBalance += parseFloat(rowData[8]);
      googleSheetsInstance.spreadsheets.values.update({
        auth: auth,
        spreadsheetId: spreadsheetId,
        range: `Active Accounts!A${rowNum}:Z${rowNum}`,
        valueInputOption: "USER_ENTERED",
        resource: { range: `Active Accounts!A${rowNum}:Z${rowNum}`, majorDimension: "ROWS", values: [
          rowData
        ]},
      });
      rowNum++;
    }
    googleSheetsInstance.spreadsheets.values.update({
      auth: auth,
      spreadsheetId: spreadsheetId,
      range: `Active Accounts!A${rowNum}:Z${rowNum}`,
      valueInputOption: "USER_ENTERED",
      resource: { range: `Active Accounts!A${rowNum}:Z${rowNum}`, majorDimension: "ROWS", values: [
        ["Total", "", "", "", "", maximumSpent, accountLimitSpent, todaySpent, remainingBalance]
      ]},
    });
    // remove all rows
    if(preRowNum >= rowNum)
    googleSheetsInstance.spreadsheets.batchUpdate({
      auth: auth,
      spreadsheetId: spreadsheetId,
      resource: {
        "requests":
        [
          {
            "deleteRange":
            {
              "range":
              {
                "sheetId": 0, // gid
                "startRowIndex": rowNum + 1,
                "endRowIndex": preRowNum + 1
              },
              "shiftDimension": "ROWS"
            }
          }
        ]
      }
    }, (err, response) => {
      console.log('response', response, err)
    })
  } catch(err) {
      console.log('me/adaccounts catch',err)
      console.log('end with error', new Date())
  }
  })
}

const getRowData = function(id) {
  return new Promise(function( resolve, reject) {
    graph.get(`${id}/?fields=spend_cap,account_id,balance,amount_spent,currency,business,name,timezone_offset_hours_utc,timezone_name`, async function(err, res) {
      const insights = new Promise(function(resolve, reject) {
        graph.get(`${id}/insights?fields=spend&date_preset=today`, function(err, response) {
          if(err) {
            reject(err)
          }
          resolve(response);
        })
      });
      const insightsData = await insights;
      const today = new Date();
      const rowData = [
        "",
        res?.name,
        res?.account_id?.toString(),
        res?.timezone_offset_hours_utc > 0 ? "UTC +" + res?.timezone_offset_hours_utc : "UTC " + res?.timezone_offset_hours_utc,
        res?.currency,
        res?.amount_spent/100,
        res?.spend_cap/100,
        insightsData?.data[0]?.spend || 0,
        (res?.spend_cap - res?.amount_spent)/100,
        today.toISOString()
      ]
      resolve(rowData);
    });
  })
}

const tractAccount = function() {
  graph.get("me/adaccounts?limit=5000", async function(err, res) {
    if(countAccount != res.data?.length){
      init(countAccount)
      countAccount = res.data?.length;
    }
  });
}

console.log = function() { //
  log_file.write(util.format.apply(null, arguments) + '\n');
  log_stdout.write(util.format.apply(null, arguments) + '\n');
};


tractAccount()
setInterval(tractAccount, process.env.trackDue * 60 * 1000);
setInterval(()=> init(countAccount), process.env.due * 60 * 1000);
