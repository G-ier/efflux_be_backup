// imports
require('dotenv').config();
const EnvironmentVariablesManager = require('../../../../src/shared/services/EnvironmentVariablesManager');
const axios = require('axios');
const crypto = require('crypto');
const FormData = require('form-data');
const fs = require('fs');
const s3Service = require("../../../shared/lib/S3Service");
const path = require('path');
const download = require('download');
const Jimp = require('jimp');
const { TiktokLogger } = require("../../../shared/lib/WinstonLogger");

// monday ids
/*
  error report field: text46__1,
  launched campaign id field: text74__1,
  launched adset id field: text1__1,
  launched ad ids field: text20__1
*/
async function tiktok_launcher() {
  // secrets

  const requiredEnvVars = ['TIKTOK_API_KEY', 'MONDAY_API_KEY', 'MONDAY_BOARD_ID'];
  for(const varName of requiredEnvVars){

    if(!EnvironmentVariablesManager.getEnvVariable(varName)){
      TiktokLogger.error(`Environment variable ${varName} is missing.`);
      throw new Error(`Environment variable ${varName} is missing.`);
    }
  }
  TiktokLogger.info(`All variables are set.`);
  return {
    "delivery": "OK"
  }

  const apiTiktok = EnvironmentVariablesManager.getEnvVariable('TIKTOK_API_KEY');
  const apiKey = EnvironmentVariablesManager.getEnvVariable('MONDAY_API_KEY');

  // constants and variables
  let cursor = null;
  const limit = 50; // Supposed to be the page size. Adjust the page size as neede
  const board_id = EnvironmentVariablesManager.getEnvVariable('MONDAY_BOARD_ID');
  const api_base = "https://business-api.tiktok.com/open_api";
  const api_version = "v1.3";
  const fail_limit = 4;
  const current_date = new Date();
  const formattedCurrentDate = `${current_date.getFullYear()}-${String(current_date.getMonth() + 1).padStart(2, '0')}-${String(current_date.getDate()).padStart(2, '0')}`;


  // result global variables
  let results = [];

  /*
  async function run() {
    const campaignId = await createCampaign();
    const adSetId = await createAdSet(campaignId);
    const imageHash = await uploadImage();
    const videoId = await uploadVideo();
    const creativeId = await createImageAdCreative(imageHash);
    // or for video: const creativeId = await createVideoAdCreative(videoId);
    await createAd(adSetId, creativeId);
  }
  */

  async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  function substituteSpaces(str) {
    return str ? str.replace(/ /g, '+') : '';
  }

  function getFormattedStartSchedule() {
    // Get the current date and time
    const now = new Date();

    // Add one hour to the current time
    now.setHours(now.getHours() + 1);

    // Format the date and time
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  function getFormattedEndSchedule() {
    // Get the current date and time
    const now = new Date();

    // Add one hour to the current time
    //now.setHours(now.getHours() + 1);
    now.setDate(now.getDate() + 5);

    // Format the date and time
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  function extractSegment (url) {
    // Define the base part we want to locate before the segment
    const startIndicator = 'resources/';
    // Find the start index of the segment
    const startIndex = url.indexOf(startIndicator);
    if (startIndex === -1) return null;

    // Extract from startIndicator to the next '/', which would be the end of the segment
    const endIndex = url.indexOf('/', startIndex + startIndicator.length);
    return url.substring(startIndex, endIndex !== -1 ? endIndex : undefined);
  };

  function getNumberFromSegment(segment) {
    const match = segment.match(/resources\/(\d+)/);
    return match ? match[1] : null;
  };

  function extractFileName(filePath) {
    // Find the start of the query string (indicated by '?') and remove it
    const cleanPath = filePath.split('?')[0];

    // Extract the filename using the last occurrence of '/'
    const fileNameWithExtension = path.basename(cleanPath);

    // Remove the file extension
    const fileNameWithoutExtension = fileNameWithExtension.replace(path.extname(fileNameWithExtension), '');

    // Remove all whitespace characters from the filename
    const fileNameNoWhitespace = fileNameWithoutExtension.replace(/\s+/g, '');

    return fileNameNoWhitespace;
  }
  function extractFileNameWithExtension(filePath) {
    // Find the start of the query string (indicated by '?') and remove it
    const cleanPath = filePath.split('?')[0];

    // Extract the filename using the last occurrence of '/'
    const fileNameWithExtension = path.basename(cleanPath);

    // Remove the file extension
    //const fileNameWithoutExtension = fileNameWithExtension.replace(path.extname(fileNameWithExtension), '');

    // Remove all whitespace characters from the filename
    const fileNameNoWhitespace = fileNameWithExtension.replace(/\s+/g, '');

    return fileNameNoWhitespace;
  }

  function extractFileExtension(filePath) {
    // Find the start of the query string (indicated by '?') and remove it
    const cleanPath = filePath.split('?')[0];

    // Extract the file extension using path.extname and remove the leading dot
    const fileExtension = path.extname(cleanPath).slice(1);

    return fileExtension;
  }

  async function getMD5Hash(filePath) {
    const hash = crypto.createHash('md5');
    console.log(`BUSSIN: ${filePath}`);
    const stream = fs.createReadStream(filePath);

    return new Promise((resolve, reject) => {
      stream.on('data', (data) => {
        hash.update(data);
      });

      stream.on('error', (err) => {
        reject(err);
      });

      stream.on('end', () => {
        const md5Hash = hash.digest('hex');
        resolve(md5Hash);
      });
    });
  }

  function appendKeyword(keyword, nextExists) {
    if (keyword) {
        return substituteSpaces(keyword) + (nextExists ? "%2C" : "");
    }
    return "";
  }

  function generateCampaignName(data) {
    let result = '';

    if (data.adAccountName) {
        result += data.adAccountName + ' | ';
    }

    if (data.buyer) {
        result += data.buyer + '_';
    }

    if (data.country) {
        result += data.country + '_';
    }

    if (data.language) {
        result += data.language + '_';
    }

    if (data.vertical) {
        result += data.vertical + '_';
    }

    if (data.uniqueIdentifier) {
        result += data.uniqueIdentifier + '_';
    }

    if (data.creativeRequestedOn) {
        result += data.creativeRequestedOn;
    }

    return result;
  }

  function generateAdsetName(data) {
    let result = 'Adset | ';

    if (data.event) {
        result += data.event + '_';
    }

    if (data.country) {
        result += data.country + '_';
    }

    if (data.language) {
        result += data.language + '_';
    }

    if (data.vertical) {
        result += data.vertical + '_';
    }

    if (data.uniqueIdentifier) {
        result += data.uniqueIdentifier + '_';
    }

    if (data.creativeRequestedOn) {
        result += data.creativeRequestedOn;
    }

    return result;
  }

  function generateFinalLink(data) {


    if (data.partner === 'DA') {
        /*
        let link = data.baseOfferLink + "&sqs=";
        link += appendKeyword(data.kw1, data.kw2 || data.kw3 || data.kw4 || data.kw5 || data.kw6 || data.kw7 || data.kw8);
        link += appendKeyword(data.kw2, data.kw3 || data.kw4 || data.kw5 || data.kw6 || data.kw7 || data.kw8);
        link += appendKeyword(data.kw3, data.kw4 || data.kw5 || data.kw6 || data.kw7 || data.kw8);
        link += appendKeyword(data.kw4, data.kw5 || data.kw6 || data.kw7 || data.kw8);
        link += appendKeyword(data.kw5, data.kw6 || data.kw7 || data.kw8);
        link += appendKeyword(data.kw6, data.kw7 || data.kw8);
        link += appendKeyword(data.kw7, data.kw8);
        link += appendKeyword(data.kw8, false);
        */

        let link = data.baseOfferLink;

        link += "&ad_title=" + substituteSpaces(data.adTitle);
        link += "&buyer=" + substituteSpaces(data.buyer);
        link += "&creator=" + substituteSpaces(data.creator);
        link += "&creative_manager=" + substituteSpaces(data.creativeManagerNames);
        link += "&creative_id=" + data.requestId;

        return link;
    } else {
        return data.baseOfferLink;
    }
  }

  async function getReadyToLaunchBoardItems_lambda(cursor, limit, board_id){
    const query = `
      query ($cursor: String, $limit: Int, $board_id: ID!) {
        boards (ids: [$board_id]){
          items_page (cursor: $cursor, limit: $limit) {
            cursor
            items {
              id
              name
              column_values {
                id
                value
                text
                type
                ... on BoardRelationValue {
                  linked_item_ids
                  linked_items {
                    id
                    name
                  }
                }
                ... on FormulaValue {
                  value
                  text
                }
              }
              subitems {
                id
                column_values {
                  id
                  value
                  text
                  type
                  ... on BoardRelationValue {
                    linked_item_ids
                    linked_items {
                      id
                      name
                    }
                  }
                  ... on FormulaValue {
                    value
                    text
                  }
                }
              }
            }
          }
        }
      }
      `

      const variables = {
        cursor: cursor,
        limit: limit,
        board_id: board_id
      };

      try {
        const response = await axios.post(
          'https://api.monday.com/v2',
          {
            query: query,
            variables: variables
          },
          {
            headers: {
              Authorization: apiKey
            }
          }
        );

        console.log(response.data.data);

        return response.data.data;
      } catch (error) {
        console.error('Error fetching data from Monday API:', error);
        throw error;
      }

  }

  async function getAccessTokenFromAdAccountId(ad_account_id){
    const url = 'https://api.retool.com/v1/workflows/c775f633-f9b0-4eb9-bf41-f2400042a785/startTrigger';
    const data = {
      ad_account_id: ad_account_id
    };

    const headers = {
      'X-Workflow-Api-Key': 'retool_wk_ab2f697bdeec45729c62363e43b4cdfe',  // Replace with your actual API key if required
      'Content-Type': 'application/json'
    };

    let res;

    await axios.post(url, data, { headers })
      .then(response => {
        console.log('Webhook response:', response.data);
        res = response.data;
      })
      .catch(error => {
        console.error('Error making webhook call:', error);
      });

    return res.data;
  }

  async function getAccessTokenFromAdAccountName(ad_account_name){
    const url = 'https://api.retool.com/v1/workflows/09c43ab3-3689-4b47-abba-3cc9d3849254/startTrigger';
    const data = {
      ad_account_name: ad_account_name
    };

    const headers = {
      'X-Workflow-Api-Key': 'retool_wk_3f7d813ffbd44169bb484e42ee334ab7',  // Replace with your actual API key if required
      'Content-Type': 'application/json'
    };

    let res;

    await axios.post(url, data, { headers })
      .then(response => {
        console.log('Webhook response:', response.data);
        res = response.data;
      })
      .catch(error => {
        console.error('Error making webhook call:', error);
      });

    return res.data;
  }

  // creates a campaign
  async function create_tiktok_campaign_lambda(advertiser_id, token, campaign_name, campaign_objective, bid_strategy, daily_budget, countries){
    const apiEndpoint = api_base+`/${api_version}/`+"/campaign/create/";

    try{

      const campaign_data = {
        "advertiser_id": advertiser_id,
        "budget_mode": bid_strategy, // bid_strategy
        "campaign_name": campaign_name,
        "objective_type": campaign_objective,
        "budget": daily_budget
      }

      let resposs;

      await axios.post(apiEndpoint, campaign_data, {
        headers: {
          "Access-Token": token,
          "Content-Type": "application/json"
        }
      }).then(response => {
        //console.log('Success:', response.data);
        resposs = response.data;
      });

      return resposs.data;

    } catch (error) {
      console.error('Error fetching campaigns:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async function update_tiktok_campaign_lambda(advertiser_id, token, campaign_name, campaign_objective, bid_strategy, daily_budget, countries, campaign_id){
    const apiEndpoint = api_base+`/${api_version}/`+"/campaign/update/";

    try{

      const campaign_data = {
        "advertiser_id": advertiser_id,
        "campaign_id": campaign_id, // bid_strategy
        "campaign_name": campaign_name,
        "budget": daily_budget
      }

      let resposs;

      await axios.post(apiEndpoint, campaign_data, {
        headers: {
          "Access-Token": token,
          "Content-Type": "application/json"
        }
      })
      .then(response => {
        console.log('Success:', response.data);
        resposs = response.data;
      }).catch(error => {
        console.error('Error:', error.response ? error.response.data : error.message);
      });

      if(resposs.data.message == "Campaign name already exists. Please try another one."){

      }

      return resposs.data;

    } catch (error) {
      console.error('Error fetching campaigns:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  // creates an adset - returns created adset ID
  async function createAdSet(advertiser_id, access_token, adgroup_name, campaign_id, daily_budget, location, genders, custom_event_type, schedule_start_time, schedule_end_time, billing_event="CPC", optimization_goal="CLICK", pacing="PACING_MODE_SMOOTH", promotion_type="WEBSITE", age=["AGE_18_24"], bid=5, schedule_type="SCHEDULE_FROM_NOW", pixel_id="7343393979666382850") {


    console.log(custom_event_type);

    const locations_ids = location.split(',').map(str => str.trim());

    const adset_url = `${api_base}/${api_version}/adgroup/create/`;

    const adgroup_data = {
      "advertiser_id": advertiser_id,
      "campaign_id": campaign_id,
      "adgroup_name": adgroup_name,
      "placement_type": "PLACEMENT_TYPE_AUTOMATIC",
      //"placement": ["PLACEMENT_TIKTOK"],
      "promotion_type": "WEBSITE",
      "promotion_website_type": "UNSET",
      "location_ids": locations_ids, // [6252001]
      "age": age, // ["AGE_18_24", "AGE_25_34", "AGE_35_44"]
      "gender": "GENDER_UNLIMITED", // GENDER_UNLIMITED
      "budget": daily_budget,
      "budget_mode": "BUDGET_MODE_DAY", // BUDGET_MODE_DAY
      "schedule_type": schedule_type, // SCHEDULE_FROM_NOW
      "schedule_start_time": schedule_start_time, // 2024-06-01 12:00:00
      "optimization_goal": optimization_goal,
      "pacing": pacing,
      "billing_event": billing_event,
      "bid_price": bid, // 5.0,
      //"pixel_id": pixel_id,
      //"optimization_event": "SHOPPING",
      "conversion_bid_price": 1.3


    }

    let resposs;

    await axios.post(adset_url, adgroup_data, {
      headers: {
        "Access-Token": access_token,
        "Content-Type": "application/json"
      }
    })
    .then(response => {
      //console.log('Success:', response.data);
      resposs = response.data;
    }).catch(error => {
      console.error('Error:', error.response ? error.response.data : error.message);
    });

    return resposs.data;
  }

  async function getPublicUrls(itemId) {

    const apiToken = "eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjM5MDU4NDk2NSwiYWFpIjoxMSwidWlkIjo2MzczMDAwNSwiaWFkIjoiMjAyNC0wNy0zMFQwODozNjowNy4wMDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTk2MDQ2MzIsInJnbiI6InVzZTEifQ.IA8eWA107718o5UPUSLMnZJsSONkjWTMjwFhaJ0QPts";

    const query = `
      {
        assets(ids: ${itemId}){
          public_url
        }
      }
    `;

    try {
      const response = await axios.post('https://api.monday.com/v2', {
        query: query
      }, {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json'
        }
      });

      console.log(JSON.stringify(response.data.data.assets));

      const assets = response.data.data.assets;
      assets.forEach(asset => {
        console.log(`Public URL: ${asset.public_url}`);
      });

      return response.data.data.assets[0].public_url;
    } catch (error) {
      console.error('Error fetching assets:', error);
    }
  }

  async function uploadImageFromUrl2(ad_account_id, access_token, imageUrl) {
    const url = `https://graph.facebook.com/v20.0/act_${ad_account_id}/adimages`;
    const monday_token="eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjM5MDU4NDk2NSwiYWFpIjoxMSwidWlkIjo2MzczMDAwNSwiaWFkIjoiMjAyNC0wNy0zMFQwODozNjowNy44NDBaIiwicGVyIjoibWU6d3JpdGUiLCJhY3RpZCI6MTk2MDQ2MzIsInJnbiI6InVzZTEifQ.fg0F8CJB9tMjmAaB0tuVA_a2dcW8zo6FibuBPcsqtyw";
    // Download the image
    console.log(imageUrl);
    const response = await axios({
      url: imageUrl,
      method: 'GET',
      responseType: 'arraybuffer'
    }).catch(error => {
      console.log("Download the image");
      console.log(error);
    });

    try {

      const base64Image = new Buffer.from(response.data).toString('base64');
      console.log(base64Image);

      // Prepare form data
      const form = new FormData();
      form.append('access_token', access_token);
      //form.append('filename', imageUrl);
      //form.append('file', response.data);

      form.append('bytes', base64Image);

      // Upload the image
      const uploadResponse = await axios.post(url, form, {
        headers: {
          ...form.getHeaders()
        }
      });

      console.log('Image Hash:', uploadResponse.data.images[0].hash);
      return uploadResponse.data.images[0].hash;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async function uploadImageFromUrl(advertiser_id, access_token, creativeUrl) {
    const url = `${api_base}/${api_version}/file/image/ad/upload/`;

    try {
      /*
      // Ensure the images_to_upload directory exists
      const imageDir = path.join(__dirname, 'images_to_upload');
      if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir);
      }

      // Set the filename and path for the image
      const filename = path.basename(imageUrl);
      const imagePath = path.join(imageDir, filename);

      // Download the image as a stream and save it
      console.log(`Downloading image from: ${imageUrl}`);
      const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream', // Ensures the data is received as a stream
      });

      // Pipe the image data stream to a file
      const writer = fs.createWriteStream(imagePath);
      response.data.pipe(writer);

      // Wait for the writing process to complete
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      console.log(`Image saved to ${imagePath}`);
      */

      const download_name = extractFileNameWithExtension(creativeUrl)
      const filename = extractFileName(imageUrl);
      console.log(filename);

      //await download(imageUrl, path.dirname(path.join(__dirname, 'images_to_upload', filename+".png")), { filename: filename+".png" });
      //await download(creativeUrl, path.dirname(path.join(__dirname, download_name)), { filename: download_name});

      //await convertPngToJpg(path.join(__dirname, filename)+".png", path.join(__dirname, filename)+".jpg");

      /*
      // Create a ZIP file containing the image
      const imageDir = path.join(__dirname, 'images_to_upload');
      const zipFilePath = path.join(imageDir, `${filename}.zip`);
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level
      });

      output.on('close', () => {
        console.log(`ZIP file created: ${zipFilePath} (${archive.pointer()} total bytes)`);
      });

      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(output);
      archive.file(path.join(__dirname, 'images_to_upload', filename), { name: filename });
      await archive.finalize();

      console.log(`Image successfully zipped: ${zipFilePath}`);
      */

      // Prepare data to upload

      const image_data = {
        "advertiser_id": advertiser_id,
        "file_name": filename,
        "upload_type": "UPLOAD_BY_URL",
        "image_url": creativeUrl // upload file directly from URL
      }

      // Upload the image to Facebook
      const uploadResponse = await axios.post(url, image_data, {
        headers: {
          "Access-Token": access_token,
          "Content-Type": "application/json"
        }
      });

      console.log('image_id:', uploadResponse.data.image_id);
      return {
        image_id: uploadResponse.data.image_id,
        fileAddr: "",
        iname: filename
      };
    } catch (error) {
      console.error('Error uploading image:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async function convertPngToJpg(inputPath, outputPath) {
    try {
      // Load the PNG image
      const image = await Jimp.read(inputPath);

      // Convert the image to JPEG and save it
      await image.quality(90) // Set JPEG quality
        .writeAsync(outputPath);

      console.log(`Converted PNG to JPEG: ${outputPath}`);
    } catch (error) {
      console.error('Error converting image:', error);
    }
  }

  async function uploadVideoFromUrl(advertiser_id, access_token, creativeUrl) {
    const url = `${api_base}/${api_version}/file/video/ad/upload/`;

    try {
      /*
      // Ensure the images_to_upload directory exists
      const imageDir = path.join(__dirname, 'images_to_upload');
      if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir);
      }

      // Set the filename and path for the image
      const filename = path.basename(imageUrl);
      const imagePath = path.join(imageDir, filename);

      // Download the image as a stream and save it
      console.log(`Downloading image from: ${imageUrl}`);
      const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream', // Ensures the data is received as a stream
      });

      // Pipe the image data stream to a file
      const writer = fs.createWriteStream(imagePath);
      response.data.pipe(writer);

      // Wait for the writing process to complete
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      console.log(`Image saved to ${imagePath}`);
      */

      const download_name = extractFileNameWithExtension(creativeUrl)
      const filename = extractFileName(creativeUrl);


      //await download(imageUrl, path.dirname(path.join(__dirname, 'images_to_upload', filename+".png")), { filename: filename+".png" });
      await download(creativeUrl, path.dirname(path.join(__dirname, download_name)), { filename: download_name});

      //await convertPngToJpg(path.join(__dirname, filename)+".png", path.join(__dirname, filename)+".jpg");

      /*
      // Create a ZIP file containing the image
      const imageDir = path.join(__dirname, 'images_to_upload');
      const zipFilePath = path.join(imageDir, `${filename}.zip`);
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level
      });

      output.on('close', () => {
        console.log(`ZIP file created: ${zipFilePath} (${archive.pointer()} total bytes)`);
      });

      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(output);
      archive.file(path.join(__dirname, 'images_to_upload', filename), { name: filename });
      await archive.finalize();

      console.log(`Image successfully zipped: ${zipFilePath}`);
      */
      await sleep(2000);
      // Prepare data to upload
      const now = new Date();

      // Extract individual components from the Date object
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-based
      const day = String(now.getDate()).padStart(2, '0');
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');

      const form = new FormData();

      form.append('advertiser_id', advertiser_id);
      form.append('file_name', `${filename}_${year}-${month}-${day}-|-${hours}:${minutes}:${seconds}`);
      form.append('upload_type', 'UPLOAD_BY_FILE');
      form.append('video_file', fs.createReadStream(path.join(__dirname, download_name)));
      form.append('video_signature', await getMD5Hash(path.join(__dirname, download_name)));

      // Upload the image to Facebook
      const uploadResponse = await axios.post(url, form, {
        headers: {
          "Access-Token": access_token,
          "Content-Type": "multipart/form-data"
        }
      });

      console.log('video_id:', uploadResponse.data.data);
      return {
        video_id: uploadResponse.data.data[0].video_id,
        fileAddr: download_name,
        iname: filename
      };
    } catch (error) {
      console.error('Error uploading image:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async function uploadVideoThroughUrl(advertiser_id, access_token, creativeUrl) {
    const url = `${api_base}/${api_version}/file/image/ad/upload/`;

    try {
      /*
      // Ensure the images_to_upload directory exists
      const imageDir = path.join(__dirname, 'images_to_upload');
      if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir);
      }

      // Set the filename and path for the image
      const filename = path.basename(imageUrl);
      const imagePath = path.join(imageDir, filename);

      // Download the image as a stream and save it
      console.log(`Downloading image from: ${imageUrl}`);
      const response = await axios({
        url: imageUrl,
        method: 'GET',
        responseType: 'stream', // Ensures the data is received as a stream
      });

      // Pipe the image data stream to a file
      const writer = fs.createWriteStream(imagePath);
      response.data.pipe(writer);

      // Wait for the writing process to complete
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });

      console.log(`Image saved to ${imagePath}`);
      */

      const download_name = extractFileNameWithExtension(creativeUrl)
      const filename = extractFileName(imageUrl);
      console.log(filename);

      //await download(imageUrl, path.dirname(path.join(__dirname, 'images_to_upload', filename+".png")), { filename: filename+".png" });
      //await download(creativeUrl, path.dirname(path.join(__dirname, download_name)), { filename: download_name});

      //await convertPngToJpg(path.join(__dirname, filename)+".png", path.join(__dirname, filename)+".jpg");

      /*
      // Create a ZIP file containing the image
      const imageDir = path.join(__dirname, 'images_to_upload');
      const zipFilePath = path.join(imageDir, `${filename}.zip`);
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver('zip', {
        zlib: { level: 9 } // Sets the compression level
      });

      output.on('close', () => {
        console.log(`ZIP file created: ${zipFilePath} (${archive.pointer()} total bytes)`);
      });

      archive.on('error', (err) => {
        throw err;
      });

      archive.pipe(output);
      archive.file(path.join(__dirname, 'images_to_upload', filename), { name: filename });
      await archive.finalize();

      console.log(`Image successfully zipped: ${zipFilePath}`);
      */

      // Prepare data to upload

      const image_data = {
        "advertiser_id": advertiser_id,
        "file_name": filename,
        "upload_type": "UPLOAD_BY_URL",
        "image_url": creativeUrl // upload file directly from URL
      }

      // Upload the image to Facebook
      const uploadResponse = await axios.post(url, image_data, {
        headers: {
          "Access-Token": access_token,
          "Content-Type": "application/json"
        }
      });

      console.log('image_id:', uploadResponse.data.image_id);
      return {
        image_id: uploadResponse.data.image_id,
        fileAddr: "",
        iname: filename
      };
    } catch (error) {
      console.error('Error uploading image:', error.response ? error.response.data : error.message);
      throw error;
    }
  }

  async function storeAndDeleteFile(fileAddr, bucketName, folderName) {
    try {

      const contentType = 'image/png';
      const filename = path.basename(fileAddr);
      const data = fs.createReadStream(path.join(__dirname, fileAddr));

      // Use the existing function to store the file
      await s3Service.storeImgVidInFolder(bucketName, folderName, filename, data, contentType);
      await fs.unlink(path.join(__dirname, fileAddr));
    } catch (error) {
      //console.error('Error downloading or uploading file:', error);
    }
  }

  async function createAd(adgroup_id, video_hashes, image_hashes, advertiser_id, accessToken, ad_name='Ad Name', identity_id, identity_type, display_name, landing_page_url, call_to_action="LEARN_MORE", music_id) {
    const url = `${api_base}/${api_version}/ad/create/`;

    let creatives = [];
    let counter = 1;

    for(const kar of video_hashes){
      console.log(kar.video_id);
      creatives.push(
        {
          "call_to_action": "CONTACT_US",
          "ad_name": ad_name+" || "+`${counter}`,
          "ad_text": "boilerplate testing text",
          "ad_format": "SINGLE_VIDEO", // SINGLE_VIDEO
          "video_id": kar.video_id,
          "image_ids": ["ad-site-i18n-sg/202408075d0d7685584c2b6d4d199b2a"],
          //"app_name": "digittopia", // hardcoded value?
          "display_name": display_name, // hardcoded value?
          //"avatar_icon_web_uri": "{{url}}", // hardcoded value?
          "landing_page_url": landing_page_url, // hardcoded value?
          "identity_id": identity_id,
          "identity_type": identity_type
      }
      );

      counter += 1;
    }

    if(image_hashes.length > 1){
      const imageIds = image_hashes.map(image => image.image_id);

      creatives.push(
        {
          "call_to_action": "CONTACT_US",
          "ad_name": ad_name+" || "+`${counter}`,
          "ad_text": "boilerplate testing text",
          "ad_format": "CAROUSEL_ADS", // SINGLE_VIDEO
          //"video_id": kar.video_id,
          "image_ids": imageIds,
          "music_id": music_id,
          //"app_name": "digittopia", // hardcoded value?
          "display_name": display_name, // hardcoded value?
          //"avatar_icon_web_uri": "{{url}}", // hardcoded value?
          //"landing_page_url": landing_page_url, // hardcoded value?
          "identity_id": identity_id,
          "identity_type": identity_type
      }
      );
    } else if(image_hashes.length == 1){
      const imageIds = image_hashes.map(image => image.image_id);

      creatives.push(
        {
          "call_to_action": "CONTACT_US",
          "ad_name": ad_name+" || "+`${counter}`,
          "ad_text": "boilerplate testing text",
          "ad_format": "SINGLE_IMAGE", // SINGLE_VIDEO
          //"video_id": kar.video_id,
          "image_ids": imageIds,
          //"music_id": music_id,
          //"app_name": "digittopia", // hardcoded value?
          "display_name": display_name, // hardcoded value?
          //"avatar_icon_web_uri": "{{url}}", // hardcoded value?
          //"landing_page_url": landing_page_url, // hardcoded value?
          "identity_id": identity_id,
          "identity_type": identity_type
      }
      );
    }

    counter += 1;

    // Prepare form data
    const ad_data = {
      "advertiser_id": advertiser_id,
      "adgroup_id": adgroup_id,
      "creatives": creatives
    }

    try {
      // Send the request to create the ad
      const response = await axios.post(url, ad_data, {
        headers: {
          "Access-Token": accessToken,
          "Content-Type": "application/json"
        }
      });

      console.log('Ad ID:', response.data);
      return response.data;
    } catch (error) {
      //console.error('Error creating ad:', error);
      //throw error;
    }
  }

  async function fetchItems(cursor) {
    try {
      // Trigger the lambda function with the current cursor and page size
      const result = await getReadyToLaunchBoardItems_lambda(cursor, limit, board_id); // currently this is a query in retool

      // Push the result to the results array
      if (result && result.boards && result.boards[0] && result.boards[0].items_page && result.boards[0].items_page.items) {
        results.push(...result.boards[0].items_page.items);
      }

      // Check if the result structure is as expected and get the new cursor
      const newCursor = result?.boards?.[0]?.items_page?.cursor;

      return newCursor;
    } catch (error) {
      console.log('Error fetching items:', error);
      return null; // Stop fetching if there's an error
    }
  }

  async function update_monday_status (board_id, item_id, column_id, column_value){

    const variables = {
      board_id: board_id,
      item_id: item_id,
      column_id: column_id,
      value: column_value
    };

    const query = `
      mutation ($board_id: ID!, $item_id: ID!, $column_id: String!, $value: String!) {
        change_simple_column_value (board_id: $board_id, item_id: $item_id, column_id: $column_id, value: $value) {
          id
        }
      }
    `;

    let respo;

    await axios.post('https://api.monday.com/v2', {
      query: query,
      variables: variables
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      }
    })
    .then(response => {
      console.log(response.data);
      respo = response.data.data;
    })
    .catch(error => {
      console.error(error);
    });

    console.log(respo);
    return respo;
  }

  function isEmptyObject(obj) {
    return obj && Object.keys(obj).length === 0 && obj.constructor === Object;
  }

  // Function to trigger status update
  const updateStatus = async (item_id, column_id, column_value) => {
    const result = await update_monday_status(
      board_id,
      item_id,
      column_id,
      column_value
    );
    return result;
  };

  //converts data to correct format
  const convertToISOFormat = (dateStr) => {
    let date;
    if (!dateStr) {
      // If dateStr is empty, generate a date for the day after tomorrow
      date = new Date();
      date.setDate(date.getDate() + 2);
    } else {
      date = new Date(dateStr);
    }

    // Set time to 07:00:00
    date.setHours(7, 0, 0, 0);

    return date.toISOString();
  };



  // maybe garbage collection?
  results = [];

  do {
    cursor = await fetchItems(cursor);
    await sleep(0); // Delay for 20 seconds
  } while (cursor);

  // ----------> results should be full
  console.log("results: ");
  //console.log(JSON.stringify(results));

  //throw new Error("break.");

  // Initialize an array to store processed data
  let processedData = [];

  // Function to safely parse JSON strings
  const safeParse = (jsonString) => {
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return null;
    }
  };

  // Function to get the appropriate value from column_values
  const getColumnValue = (item, columnId) => {
    const column = item.column_values.find(col => col.id === columnId);
    if (column) {
      if (column.text) return column.text; // Normal columns
      if (column.value) {
        const parsedValue = safeParse(column.value);
        if (parsedValue) {
          if (parsedValue.value) return parsedValue.value; // Formula columns
          if (Array.isArray(parsedValue.linkedPulseIds)) {
            return parsedValue.linkedPulseIds.map(linkedItem => linkedItem.linkedPulseId).join(", "); // Linked items as comma-separated string
          }
        } else {
          return column.value ? column.value : ""; // Directly return the value if it's not JSON, as a string
        }
      }
    }
    return "";
  };

  // Process each item directly
  processedData = results.map(item => {
    const requestId = getColumnValue(item, 'item_id__1'); // done
    const adAccount = getColumnValue(item, 'status0__1'); // done
    const adAccountName = getColumnValue(item, 'text5__1'); // done
    const feedCampaignName = getColumnValue(item, 'text92__1'); // ??
    //const campModifier = getColumnValue(item, 'text3__1');
    //const dateCreated = getColumnValue(item, 'date7');
    //const geoSwitch = getColumnValue(item, 'dropdown2__1');
    //const adsetMod = getColumnValue(item, 'text76__1'); // done


    const campaign_data = {
      adAccountName: adAccountName,
      buyer: getColumnValue(item, 'dup__of_buyer__1'),
      country: getColumnValue(item, 'country__1'),
      language: getColumnValue(item, 'text4'),
      vertical: getColumnValue(item, 'text__1'),
      uniqueIdentifier: getColumnValue(item, 'text41__1'),
      creativeRequestedOn: getColumnValue(item, 'date8__1')
    };

    const adset_data = {
      event: getColumnValue(item, 'dropdown83'),
      country: getColumnValue(item, 'country__1'),
      language: getColumnValue(item, 'text4'),
      vertical: getColumnValue(item, 'text__1'),
      uniqueIdentifier: getColumnValue(item, 'text41__1'),
      creativeRequestedOn: getColumnValue(item, 'date8__1')
    };

    const link_data = {
      partner: getColumnValue(item, 'status2__1'),
      baseOfferLink: getColumnValue(item, 'long_text__1'),
      kw1: getColumnValue(item, 'text4__1'),
      kw2: getColumnValue(item, 'dup__of_kw1__1'),
      kw3: getColumnValue(item, 'dup__of_kw2__1'),
      kw4: getColumnValue(item, 'text29__1'),
      kw5: getColumnValue(item, 'text7__1'),
      kw6: getColumnValue(item, 'text2__1'),
      kw7: getColumnValue(item, 'dup__of_kw6__1'), // (word 7 missing correct id)
      kw8: getColumnValue(item, 'dup__of_kw7__1'),
      adTitle: getColumnValue(item, 'text72__1'),
      buyer: getColumnValue(item, 'dup__of_buyer__1'),
      creator: getColumnValue(item, 'people2__1'),
      creativeManagerNames: getColumnValue(item, 'people4__1'),
      requestId: requestId
    };

    const campaignName = generateCampaignName(campaign_data);
    const adSetName = generateAdsetName(adset_data);
    const final_link = generateFinalLink(link_data);


    return {
      // add new fields from monday TODO
      id: item.id,
      name: item.name,
      priority: getColumnValue(item, 'status_1'), // done
      copywriting: getColumnValue(item, 'status_12__1'), // done
      category: getColumnValue(item, 'text63__1'), // done
      page_name: getColumnValue(item, 'page_name__1'), // done
      profile_to_launch_with: getColumnValue(item, 'profile_to_launch_with__1'), // done
      pixel_name: getColumnValue(item, 'pixel_name__1'), // done
      launching_plateform: getColumnValue(item, 'dropdown07'),
      plateform: getColumnValue(item, 'status__1'), // done
      request_id: requestId, // done
      buyer: getColumnValue(item, 'dup__of_buyer__1'), // done
      creatives: getColumnValue(item, 'files__1'), // done
      total_videos_requested: getColumnValue(item, 'numbers93__1'), // done
      total_images_requested: getColumnValue(item, 'numeric__1'), // done
      creator: getColumnValue(item, 'people2__1'), // done
      //creator_manager: getColumnValue(item, 'people__1'), // team lead? done
      campaign_id: getColumnValue(item, 'text0__1'),
      ad_title: getColumnValue(item, 'text72__1'), // done
      feed_name: getColumnValue(item, 'text92__1'), // done
      feed_campaign_name: feedCampaignName,
      //buyer_tag: getColumnValue(item, 'text8__1'),
      country: getColumnValue(item, 'country__1'), // done
      //due_date: getColumnValue(item, 'date'),
      vertical: getColumnValue(item, 'text__1'), // done
      //requested_domain: getColumnValue(item, 'domain_name__1'), // done but domain_name?????
      //keywords: getColumnValue(item, 'keywords__1'), // or keywords
      final_link: final_link, // done
      inspo: getColumnValue(item, 'files1__1'), // done
      //creative_id: getColumnValue(item, 'text308__1'),
      //creative_template: getColumnValue(item, 'long_text__1'),
      content_type: getColumnValue(item, 'content_type__1'), // done
      method: getColumnValue(item, 'dropdown1__1'), // done
      event: getColumnValue(item, 'dropdown83'), // done
      age: getColumnValue(item, 'text8__1'), // done
      gender: getColumnValue(item, 'dropdown8__1'), // done
      language: getColumnValue(item, 'text4'), // done
      bid: getColumnValue(item, 'numbers9__1'), // done
      bid_strategy: getColumnValue(item, 'dropdown78__1'), // done
      delivery_type: getColumnValue(item, 'dropdown12__1'), // done
      primary_text: getColumnValue(item, 'long_text9__1'), // done
      headlines: getColumnValue(item, 'long_text3__1'), // done
      description: getColumnValue(item, 'long_text0__1'), // done
      call_to_action: getColumnValue(item, 'dropdown5__1'), // done
      identity_id: getColumnValue(item, 'text929__1'), // done
      identity_type: getColumnValue(item, 'text47__1'), // done
      display_name: getColumnValue(item, 'text3__1'), // done
      music_id: getColumnValue(item, 'text15__1'), // done
      campaign_budget_mode: getColumnValue(item, 'dropdown__1'),
      conversion_bid: getColumnValue(item, 'text294__1'),
      schedule_start: getColumnValue(item, 'text03__1'), // done
      schedule_end: getColumnValue(item, 'text32__1'), // done
      //link_creator: getColumnValue(item, 'people7'),
      //launcher_va: getColumnValue(item, 'people8'),
      launched_date: getColumnValue(item, 'date5__1'), // creative launched on done
      //date_approved: getColumnValue(item, 'date6'),
      //date_created: dateCreated,
      requested_date: getColumnValue(item, 'date8__1'), // creative requested
      //date_uploaded: getColumnValue(item, 'date__1'),
      //camp_modifier: campModifier,
      grouping: getColumnValue(item, 'dropdown29__1'), // done
      camp_structure: getColumnValue(item, 'text9__1'), // done
      //family_id: getColumnValue(item, 'text83__1'),
      adset_mod: getColumnValue(item, 'text76__1'), // done
      //geo_switch: geoSwitch,
      special_ads_category: getColumnValue(item, 'dropdown7__1'), // done
      //page_satus: getColumnValue(item, 'status_17__1'),
      //account_status: getColumnValue(item, 'dup__of_page_status__1'),
      subitems: item.subitems,
      campaign_budget_mode: getColumnValue(item, 'dropdown__1'),
      billing_event: getColumnValue(item, 'billing_event__1'),
      ad_group_budget_mode: getColumnValue(item, 'ad_group_budget_mode__1'),
      pacing: getColumnValue(item, 'pacing__1'),
      opt_goal: getColumnValue(item, 'optimization_goal__1'),
      opt_event: getColumnValue(item, 'optimization_event__1'),
      shopping_ads_type: getColumnValue(item, 'dropdown0__1'),
      product_source: getColumnValue(item, 'dropdown6__1'),
      placement_type: getColumnValue(item, 'placement__1'),
      placement: getColumnValue(item, 'placement9__1'),
      schedule_type: getColumnValue(item, 'schedule_type__1'),
      promotion_type: getColumnValue(item, 'promotion_type__1'),
      promotion_target_type: getColumnValue(item, 'dropdown06__1'),
      promotion_website_type: getColumnValue(item, 'promotion_website_type__1'),
      target_os: getColumnValue(item, 'target_operating_system__1'),
      projected_launch: getColumnValue(item, 'date6__1'),
      fail_counter: getColumnValue(item, 'text49__1'),
      // required for launcher
      ad_account: adAccount,
      status: getColumnValue(item, 'status62__1'), // done
      launcher_progress: getColumnValue(item, 'status_1__1'), // Launched Campaign ID done
      launched_campaign_id: getColumnValue(item, 'text74__1'), // Launched Campaign ID done
      launched_adset_id: getColumnValue(item, 'text1__1'), // Launched adset ID done
      launched_ad_ids: getColumnValue(item, 'text20__1'), //launched ad Ids done
      // required for creating campaign
      ad_account_id: getColumnValue(item, 'ad_account_id__1'), // done
      campaign_name: campaignName, // Campaign Name
      campaign_objective: getColumnValue(item, 'status_13__1'), // Campaign Objective done
      special_ad_categories: getColumnValue(item, 'dropdown7__1'), // Special Ad Categories done ???
      campaign_bid_strategy: getColumnValue(item, 'status_18__1'), // Campaign Bid Strategy done
      campaign_budget: getColumnValue(item, 'numbers__1'), // Campaign Budget done
      campaign_start_date: getColumnValue(item, 'date__1'), // Campaign Start Date done
      //required for creating ad_set
      ad_set_name: adSetName,
      adAccountName: adAccountName,
      adTitle: getColumnValue(item, 'text72__1')
    };
  });

  // ----------> processedData should be full

  // filter ready to launch status

  console.log("processedData: ");
  //console.log(JSON.stringify(processedData));

  let readyToLaunch = [];

  for(const pdata of processedData){
    //console.log(pdata.plateform);
    if(pdata.status == 'Request for AdLauncher' && pdata.plateform == 'TikTok Pangle' && pdata.projected_launch <= formattedCurrentDate){
      readyToLaunch.push(pdata);
    }
  }

  // ----------> readyToLaunch should be full

  console.log("readyToLaunch: ");
  //console.log(JSON.stringify(readyToLaunch));

  // get ready to launch

  // loop here - TODO
  let launchables = [];

  for(const row of readyToLaunch){

    const item_id = row.id;

    // remove these TODO
    const campaignObjectiveMapping = {
      "TRAFFIC": "TRAFFIC",
      "APP_PROMOTION": "APP_PROMOTION",
      "PRODUCT_SALES": "PRODUCT_SALES"
    };

    const campaignBidStrategyMapping = {
      "BUDGET_MODE_INFINITE": "BUDGET_MODE_INFINITE",
      "BUDGET_MODE_TOTAL": "BUDGET_MODE_TOTAL",
      "BUDGET_MODE_DAY": "BUDGET_MODE_DAY",
      "BUDGET_MODE_DYNAMIC_DAILY_BUDGET": "BUDGET_MODE_DYNAMIC_DAILY_BUDGET"
    };




    // Change 'status' column to 'Launching in progress'
    let resultStatusUpdate = await updateStatus(item_id, 'status62__1', 'Launching in progress');
    if (!resultStatusUpdate.change_simple_column_value || resultStatusUpdate.change_simple_column_value.id !== item_id) {
      await updateStatus('text46__1', 'Error updating status to "Launching in progress".');
      throw new Error('Error updating status to "Launching in progress".');
    }
    else{
      await updateStatus(item_id, 'text46__1', '');
    }

    // Check if row has values for ad_account, ad_account_id, campaign name, and campaign budget
    if (!row.ad_account && !row.ad_account_id) {
      await updateStatus(item_id, 'text46__1', 'Error: ad_account or ad_account_id is missing.');
      await updateStatus(item_id, 'status62__1', 'More details needed.');
      throw new Error('Error: ad_account or ad_account_id is missing.');
    }
    if (!row.campaign_name) {
      await updateStatus(item_id, 'text46__1', 'Error: campaign name is missing.');
      await updateStatus(item_id, 'status62__1', 'More details needed.');
      throw new Error('Error: campaign name is missing.');
    }
    if (!row.campaign_budget) {
      await updateStatus(item_id, 'text46__1', 'Error: campaign budget is missing.');
      await updateStatus(item_id, 'status62__1', 'More details needed.');
      throw new Error('Error: campaign budget is missing.');
    }

    // Change 'Launcher Progress' to 'Creating campaign'
    resultStatusUpdate = await updateStatus(item_id, 'status_1__1', 'Creating Campaign');
    if (!resultStatusUpdate.change_simple_column_value || resultStatusUpdate.change_simple_column_value.id !== item_id) {
      await updateStatus(item_id, 'text46__1', 'Error updating status to "Creating Campaign".');
      throw new Error('Error updating status to "Creating Campaign".');
    }

    const ad_account_id = row.ad_account_id;
    let access_token = apiTiktok; // init with null when commenting the coming section in

    // create the object to launch
    const create_campaign_object = {};
    create_campaign_object.ad_account_id = ad_account_id; // required
    create_campaign_object.access_token = access_token; // required
    create_campaign_object.campaign_name = row.campaign_name; // required
    create_campaign_object.campaign_objective = campaignObjectiveMapping[row.campaign_objective] || 'TRAFFIC';
    create_campaign_object.bid_strategy = campaignBidStrategyMapping[row.campaign_bid_strategy] ? campaignBidStrategyMapping[row.campaign_bid_strategy] : row.campaign_bid_strategy || 'BUDGET_MODE_DAY'; // change the campaign bid mapping also move from campaign_bid_strategy to campaign budget mode TODO
    create_campaign_object.ad_category = row.special_ad_categories || '';
    create_campaign_object.daily_budget = row.campaign_budget || 10;
    create_campaign_object.start_date = await convertToISOFormat(row.campaign_start_date);
    create_campaign_object.row = row;

    launchables.push(create_campaign_object);

  }

  // ----------> launchables should be full

  let createdCampaigns = [];

  for(const payload of launchables){

    let createCampaignObject = payload;

    const item_id = payload.row.id;
    const countries = payload.row.country;
    const ad_account_id = payload.ad_account_id;
    const access_token = payload.access_token;
    const campaign_name = payload.campaign_name;
    const campaign_objective = payload.campaign_objective;
    const bid_strategy = payload.bid_strategy;
    const daily_budget = payload.daily_budget;

    console.log("ad_categories: "+payload.ad_category);

    // create campaign - TODO
    let result = await create_tiktok_campaign_lambda(
      ad_account_id,
      apiTiktok,
      campaign_name,
      campaign_objective,
      bid_strategy,
      daily_budget,
      countries
    ).catch(error => {
      console.log(error);
      // Find the right error
      // Push it to monday
    })
    //throw new Error("Break type error.");
    //console.log(result);
    /*
    if(resposs.data.message == "Campaign name already exists. Please try another one."){
      result = await update_tiktok_campaign_lambda(
        ad_account_id,
        apiTiktok,
        campaign_name,
        campaign_objective,
        bid_strategy,
        daily_budget,
        countries
      );
    }
    */

    if (result && result.campaign_id) {
      createCampaignObject.row.launched_campaign_id = result.campaign_id;
      createCampaignObject.launched_campaign_id = result.campaign_id;

      // Update status to "Campaign created"
      let resultStatusUpdate = await updateStatus(item_id, 'status_1__1', 'Campaign Created');
      if (!resultStatusUpdate.change_simple_column_value || resultStatusUpdate.change_simple_column_value.id !== item_id) {
        await updateStatus(item_id, 'text46__1', 'Error updating status to "Campaign Created".');
        throw new Error('Error updating status to "Campaign Created".');
      } else {
        await updateStatus(item_id, 'text74__1', result.campaign_id ? result.campaign_id : ''); // launched campaign id
        createdCampaigns.push(payload);
      }
    } else {
      await updateStatus(item_id, 'text46__1', 'Error creating Facebook campaign.');
      console.log("skiobidi");
      console.log(result);
      if(result.message != "OK"){
        await updateStatus(item_id, 'text07__1', result.message);
      }
      await updateStatus(item_id, 'text68__1', `${JSON.stringify(result)}`);
      throw new Error('Error creating Facebook campaign.');
    }

  }

  // -----------------> createdCampaigns full

  //console.log(JSON.stringify(createdCampaigns[0]));

  for(const createdCamp of createdCampaigns){

    console.log("Pass page_id");
    const item_id_c = createdCamp.row.id;
    //console.log(pg_ids);

    /*
    Page Name: Smiling Savers, Page ID: 237082216160817
    Page Name: Simple Seek, Page ID: 203681126168692
    Page Name: Further Lookup, Page ID: 221485421047506
    Page Name: Search Ideas, Page ID: 206905615844512
    Page Name: Trend Pro, Page ID: 243796538808110
    Page Name: Digittopia, Page ID: 131388863396004
    Page Name: Top Edu Searches, Page ID: 105690622328893
    Page Name: Everyday Tops Search, Page ID: 109435181837419
    Page Name: Everyday Tops Searche, Page ID: 111858541588904
    Page Name: Bridgewater Health Systems, Page ID: 102519229203657
    Page Name: Modern Munchkin, Page ID: 102735589142250
    Page Name: Hiring Heros, Page ID: 105040012241737
    Page Name: Better Days, Page ID: 103084125771406
    Page Name: Modern Day, Page ID: 103693225708657
    Page Name: Monthly Modern, Page ID: 101746499239702
    Page Name: Daily Movement, Page ID: 102692392461781
    Page Name: All Credits Auto, Page ID: 105066175508609
    Page Name: Daily Search Find, Page ID: 101846842484615
    Page Name: Daily Search Finder, Page ID: 107046811949219
    Page Name: The Baby Box Club, Page ID: 105026815489460
    Page Name: Dailyy Top Searches, Page ID: 102206249107271
    Page Name: Daily Amazing Answers, Page ID: 103310278994307
    Page Name: Daily Top Comparisons, Page ID: 111028791529025
    Page Name: Top Searches Daily, Page ID: 101761902463731
    Page Name: Local Jobs Finder, Page ID: 112107008065724
    Page Name: Local Top Searches, Page ID: 100691792497827
    Page Name: Sevenbars, Page ID: 105465195298131
    Page Name: PawsTips, Page ID: 109168488211698
    Page Name: Daily Super Searches, Page ID: 101082378978566
    Page Name: Top Searches Finder, Page ID: 102768662107102
    Page Name: Top Daily Consumers, Page ID: 109276898091725
    Page Name: Everyday Local Searches, Page ID: 101105848920433
    Page Name: Top Job Searches, Page ID: 105182695035608
    Page Name: Wonderful Answers, Page ID: 104825955038405
    Page Name: Incredible Answers, Page ID: 105404204965137
    Page Name: Zeegbe, Page ID: 100786718057816
    */

    // create new adset
    const adset_reponse = await createAdSet(
      ad_account_id=createdCamp.ad_account_id,
      access_token=createdCamp.access_token,
      adgroup_name = createdCamp.row.ad_set_name,
      campaign_id = createdCamp.row.launched_campaign_id,
      daily_budget=createdCamp.daily_budget,
      location=createdCamp.row.country,
      genders=createdCamp.row.gender,
      custom_event_type=createdCamp.row.event,
      schedule_start_time=getFormattedStartSchedule(),
      schedule_end_time=getFormattedEndSchedule(),

    ).catch(error => {
      console.log("Error in adset creation:");
      //console.log(error);
    });

    console.log("Pass createAdSet");

    if (adset_reponse && adset_reponse.adgroup_id) {
      createdCamp.row.launched_adset_id = adset_reponse.adgroup_id;

      await updateStatus(item_id_c, 'text1__1', adset_reponse.adgroup_id ? adset_reponse.adgroup_id : ''); // launched ad group id
    } else {
      await updateStatus(item_id_c, 'text46__1', 'Error creating Tiktok ad group.');
      if(adset_reponse.message != "OK"){
        await updateStatus(item_id_c, 'text07__1', adset_reponse.message);
      }
      await updateStatus(item_id_c, 'text68__1', `${JSON.stringify(adset_reponse)}`);
      continue;
    }



    let image_hashes = [];
    let video_hashes = [];

    // control variables for type
    let single_image = false;
    let single_video = false;
    let carousel_ad = false;

    let bad_counter = 0;
    // make the decision whether single_image, single video or carousel

    if(parseInt(createdCamp.row.total_images_requested, 10)+parseInt(createdCamp.row.total_videos_requested, 10)>1){
      // its CAROUSEL_ADS
      carousel_ad = true;

      const urls = createdCamp.row.creatives.split(',').map(str => str.trim());
      console.log(`URLs: ${urls}`)
      for(const image_url of urls){
        // upload creative
        const seg = extractSegment(image_url);
        const item_id = getNumberFromSegment(seg);
        //console.log(item_id);
        const public_url = await getPublicUrls(item_id);

        // check the file format to automatically complete logic
        const file_format = extractFileExtension(public_url);

        console.log(`File format: ${file_format}`)

        if(file_format == "mp4"){
          const hash_obj = await uploadVideoFromUrl(ad_account_id=createdCamp.ad_account_id, access_token=createdCamp.access_token, public_url).catch(error => {
            console.log("Error in image upload:");
            console.log(error);
            bad_counter += 1;

          });

          if(hash_obj){
            video_hashes.push({video_id:hash_obj.video_id, attachment_type:'video', iname: hash_obj.iname});
            await fs.unlink(path.join(__dirname, hash_obj.fileAddr), (err) => {
              if (err) {
                console.error(`Error deleting file: ${err.message}`);
                return; // fi
              }
              console.log('File deleted successfully');
            });
          }


          // upload image to S3
          /*
          await storeAndDeleteFile(hash_obj.fileAddr, "facebook-images-videos", "facebook").catch(error => {
            console.log("Error in image to S3 upload:");

          });

          */

        } else if(file_format == "png" || file_format == "jpeg" || file_format == "jpg") {
          const hash_obj = await uploadImageFromUrl(ad_account_id=createdCamp.ad_account_id, access_token=createdCamp.access_token, public_url).catch(error => {
            console.log("Error in image upload:");
            //console.log(error);
            bad_counter += 1;

          });

          if(hash_obj){
            image_hashes.push({image_id:hash_obj.image_id, attachment_type:'video', iname: hash_obj.iname});
          }

        }


        console.log("CREATIVE UPLOAD SUCCESS!!");
        console.log("CREATIVE UPLOAD SUCCESS!!");
        console.log("CREATIVE UPLOAD SUCCESS!!");



      }

    }


    console.log("Pass creatives");

    // create the new ad
    // identity_id = "7359638754166702098" // EmailMarketingJobs
    const ad_id = await createAd(
      adgroup_id=adset_reponse.adgroup_id,
      video_hashes=video_hashes,
      image_hashes=image_hashes,
      advertiser_id=createdCamp.ad_account_id,
      accessToken=createdCamp.access_token,
      ad_name=createdCamp.row.adTitle,
      identity_id="7359638754166702098",
      identity_type="CUSTOMIZED_USER",
      display_name="EmailMarketingJobs",
      landing_page_url=createdCamp.row.final_link,
      call_to_action=createdCamp.row.call_to_action,
      music_id="7396726317032966161"
    ).catch(error => {
      console.log("Error in ad creation:");
      //console.log(error);
    });

    console.log("Pass ad");

    if(ad_id && ad_id.data && ad_id.data.ad_ids){
      createdCamp.row.launched_ad_ids = ad_id.data.ad_ids.join(', ');
      await updateStatus(item_id_c, 'text20__1', ad_id.data.ad_ids.join(', ')); // launched ad group id
      await updateStatus(item_id, 'status62__1', 'launched');
    } else {
      await updateStatus(item_id_c, 'text46__1', 'Error creating Tiktok ad.');
      if(ad_id.message != "OK"){
        await updateStatus(item_id_c, 'text07__1', ad_id.message);
      }
      await updateStatus(item_id_c, 'text68__1', `${JSON.stringify(ad_id)}`);
      // Fail to manual logic
      let fail_current = 1;
      if(createdCamp.row.fail_counter){
        if(createdCamp.row.fail_counter == fail_limit){
          await updateStatus(item_id, 'status62__1', 'Resort to manual launch');
          throw new Error("Could not create tiktok ad and fail limit has been reached.");
        }
        fail_current = parseInt(createdCamp.row.fail_counter) + 1;
      }
      await updateStatus(item_id, 'text49__1', `${fail_current}`);
      // --------------------
      await updateStatus(item_id, 'status62__1', 'Launch Fail');
      throw new Error("Could not create tiktok ad.");
    }

    console.log(`AD CREATED: ${ad_id}`);


  }

  return {
    "delivery": "OK"
  }
}

module.exports = tiktok_launcher;
