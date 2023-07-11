const _ = require('lodash');
const route = require('express').Router();
const wrap = require("../../utils/wrap");
const spreadsheets = require("../../services/spreadsheetService");

function calculateValuesForGeneratedSpreadsheet(data, columns) {
  const rows = data.map((item) => {
    return results = {
      ad_library_link: item.ad_library_link,
      ad_starting_date: item.ad_starting_date,
      ad_headline: item.ad_headline,
      ad_primary_text: item.ad_primary_text,
      ad_description: item.ad_description,
      ad_publisher_name: item.ad_publisher_name,
      cdn_url: item.cdn_url,
      keywords: item.keywords,
      network: item.network,
      domain: item.domain
    }
  });
  return rows;
}

function extractDomain(link) {
  let domainStartIndex = link.indexOf("://") + 3;
  let domainEndIndex = link.indexOf("/", domainStartIndex);
  return link.substring(domainStartIndex, domainEndIndex);
}

// @route     /api/ad-generator/generate-google-spreadsheet
// @desc     Post create ad-generator google sheets
// @Access   Private
route.post('/generate-google-spreadsheet',

  wrap(async (req, res) => {

    const spreadsheetData = req.body;

    // Processing keywords
    for (let i = 0; i < spreadsheetData.length; i++) {
      const ad = spreadsheetData[i]
      ad.ad_library_link = `https://www.facebook.com/ads/library/?id=${ad.ad_archive_id}`
      ad.domain = ad.landing_url ? extractDomain(ad.landing_url) : 'Unkown'
      ad.keywords = ad.keywords.reduce((acc, keyword) => {
        return acc + (acc !== '' ? ", " : "" ) + keyword
      }, "")
    }

    const columns = ['ad_library_link', 'domain','ad_starting_date', 'ad_headline', 'ad_primary_text',
    'ad_description', 'ad_publisher_name', 'cdn_url', 'keywords', 'network']

    // Create the spreadsheet with access to the given emails
    const emailsWithAccess = ['deni@roi.ad', 'm@roi.ad', 'p@roi.ad', 'losid@roi.ad', 'timothy@roi.ad']
    let spreadsheetId = '1YnbgGxKuWoCOLfwA6cpFTT-hlM88G-jNPNae8J4d80A'
    spreadsheetId = await spreadsheets.createSpreadsheet('Scrapping Request', emailsWithAccess)

    // Check if the spreadsheet was created
    if (!spreadsheetId) return res.status(400).json({"message": "Error creating spreadsheet"});

    // Add the data to the spreadsheet
    const spreadSheetPostProcessedData = calculateValuesForGeneratedSpreadsheet(spreadsheetData, columns);

    // Grouping ads by sheets based on domain
    const parsedData = spreadSheetPostProcessedData.reduce((acc, ad) => {
      const domain = ad.domain
      if (!acc[domain]) {
        acc[domain] = []
      }
      acc[domain].push(ad)
      return acc
    }, {})


    Object.entries(parsedData).forEach(async (data) => {

      const [sheetName, preProcessedData] = data
      const postProcessedData = { columns, rows: preProcessedData}

      // Adding the new sheet
      await spreadsheets.addNewSheet(spreadsheetId, sheetName)

      // Updating the sheet with the data
      await spreadsheets.updateSpreadsheet(
        postProcessedData,
        {spreadsheetId, sheetName: sheetName},
        predifeniedRange = "",
        include_columns = true,
        add_last_update = false
      )

    })

    return res.status(200).json(spreadsheetId);

  })

);

module.exports = route;
