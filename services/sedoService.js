const _ = require('lodash');
const soapRequest = require('easy-soap-request');
const xml2js = require('xml2js');
const {yesterdayYMD, todayYMD} = require("../common/day");
const db = require('../data/dbConfig');

const browserObject = require('./../scripts/sedoScrape/browser');
const pageScraper = require('./../scripts/sedoScrape/pageScraper');

const parseXml = async (body) => {
  return new Promise((resolve, reject) => {
    xml2js.parseString(body, (err, result) => {
      if(err) reject(err);
      resolve(result)
    })
  })
  
}

const extractDomainStatistics = async (str) => {
  return new Promise((resolve, reject) => {    
    let stats = str.SEDOSTATS.item;       
    stats = stats.map(item => {
      return {
        domain: item.domain[0]._,
        date: item.date[0]._,
        visitors: item.visitors[0]._,
        clicks: item.clicks[0]._,
        earnings: item.earnings[0]._,        
      }
    })
    stats = stats.filter(item => !!item.domain)
    resolve(stats)
  })
}
const getDomainParkingFinalStatistics = async (date) => {
  const url = 'https://api.sedo.com/api/v1/DomainParkingFinalStatistics?';
  const params = new URLSearchParams({
    'partnerid'     : process.env.SEDO_PARTNERID,
    'signkey'       : process.env.SEDO_SIGNKEY,
    'username'      : process.env.SEDO_USERNAME,
    'password'      : process.env.SEDO_PASSWORD,
    'output_method' : 'xml',    
    'period'        : 0,
    'date'          : date,
    'startfrom'     : 0,
    'results'       : 10000,
  });
  const query = params.toString();
  return new Promise(async (resolve, reject) => {    
    const { response } = await soapRequest({ url: url + query, timeout: 10000 });
    const { body, statusCode } = response;
    if(statusCode == 200) {
      let bodyRes = await parseXml(body);         
      if(!bodyRes.SEDOSTATS) {          
        reject(bodyRes.SEDOFAULT.faultstring)          
      }
      bodyRes = await extractDomainStatistics(bodyRes);
      resolve(bodyRes)
    }    
  })  
}

const extractDomainSubIdReport = async (str) => {
  return new Promise((resolve, reject) => {  
    try{      
      let stats = str.SEDOSTATS.item;      
      stats = stats.map(item => {
        return {
          domain: item.domain[0]._,
          date: item.date[0]._,
          sub1: item.c1[0]._,
          sub2: item.c2[0]._,
          sub3: item.c3[0]._,
          visitors: item.uniques[0]._,
          clicks: item.clicks[0]._,
          earnings: item.earnings[0]._,        
        }
      })
      stats = stats.filter(item => !!item.domain)
      resolve(stats)       
    } catch(err) {
      reject(err)
    }
  })
}

const getDomainParkingSubIdReport = async (date) => {
  try{
    const url = 'https://api.sedo.com/api/v1/DomainParkingSubIdReport?';
    const params = new URLSearchParams({
      'partnerid'     : process.env.SEDO_PARTNERID,
      'signkey'       : process.env.SEDO_SIGNKEY,
      'username'      : process.env.SEDO_USERNAME,
      'password'      : process.env.SEDO_PASSWORD,
      'output_method' : 'xml',
      'final'         : false,
      'date'          : date,
      'startfrom'     : 0,
      'results'       : 10000,
    });
    const query = params.toString();
    return new Promise(async (resolve, reject) => {
      const { response } = await soapRequest({ url: url + query, timeout: 10000 }); // Optional timeout parameter(milliseconds)
      const { body, statusCode } = response;
      if(statusCode == 200) {
        let bodyRes = await parseXml(body);        
        if(!bodyRes.SEDOSTATS) {          
          reject(bodyRes.SEDOFAULT.faultstring)          
        } else{
          bodyRes = await extractDomainSubIdReport(bodyRes);
          resolve(bodyRes)
        }
      }
      else{
        reject(body)
      }
    })
    
  }
  catch(err) {    
    console.log('err', err)
    return err
  }
}

async function updateData(data, date) {
  const existedData = await db.select('*').from('sedo')
   .whereRaw('date >= ?', [date])

  const existedDataMap = _.keyBy(existedData, ({domain, date, sub1, sub2, sub3}) => {
    return `${domain}||${date}||${sub1}||${sub2}||${sub3}`;
  });

  const {skipArr = [], updateArr = [], createArr = []} = _.groupBy(data, item => {
    const key = `${item.domain}||${item.date}||${item.sub1}||${item.sub2}||${item.sub3}`
    const existedSystem = existedDataMap[key];
    if (!existedSystem) return 'createArr';
    if (existedSystem) {
      if (existedSystem.earnings !== item.earnings ||
        existedSystem.clicks !== item.clicks ||
        existedSystem.visitors !== item.visitors
      ) return 'updateArr';
      return 'skipArr';
    }
  });

  let result = {
    created: 0,
    updated: 0,
    skipped: 0,
  };

  if (createArr.length) {
    const created = await db('sedo').insert(createArr);
    result.created = created.rowCount;
  }

  if (updateArr.length) {
    const updated = await Promise.all(
      updateArr.map(item => {
        return db('sedo')
          .where({domain: item.domain, date: item.date, sub1: item.sub1, sub2: item.sub2, sub3: item.sub3}).first()
          .update({
            revenue: item.revenue,
            clicks: item.clicks,
            visitors: item.visitors,            
          }).returning('id')
      })
    );
    result.updated = updated.length;
  }

   result.skipped = skipArr.length;

  console.log(`ADDED ${result.created} ROWS FROM SEDO`);
  console.log(`UPDATED ${result.updated} ROWS FROM SEDO`);
  console.log(`SKIPPED ${result.skipped} ROWS FROM SEDO`);

  return result;
}

async function updateSedoDomainData(data, date) {
  const existedData = await db.select('*').from('sedo_domain')
   .whereRaw('date >= ?', [date])

  const existedDataMap = _.keyBy(existedData, ({domain, date}) => {
    return `${domain}||${date}`;
  });

  const {skipArr = [], updateArr = [], createArr = []} = _.groupBy(data, item => {
    const key = `${item.domain}||${item.date}`
    const existedSystem = existedDataMap[key];
    if (!existedSystem) return 'createArr';
    if (existedSystem) {
      if (existedSystem.earnings !== item.earnings ||
        existedSystem.clicks !== item.clicks ||
        existedSystem.visitors !== item.visitors
      ) return 'updateArr';
      return 'skipArr';

    }
  });

  let result = {
    created: 0,
    updated: 0,
    skipped: 0,
  };

  if (createArr.length) {
    const created = await db('sedo_domain').insert(createArr);
    result.created = created.rowCount;
  }

  if (updateArr.length) {
    const updated = await Promise.all(
      updateArr.map(item => {
        return db('sedo_domain')
          .where({domain: item.domain, date: item.date}).first()
          .update({
            earnings: item.earnings,
            clicks: item.clicks,
            visitors: item.visitors,          
            epc: item.epc,          
            ctr: item.ctr,          
            rpm: item.rpm     
          }).returning('id')
      })
    );
    result.updated = updated.length;
  }

   result.skipped = skipArr.length;

  console.log(`ADDED ${result.created} ROWS FROM SEDO`);
  console.log(`UPDATED ${result.updated} ROWS FROM SEDO`);
  console.log(`SKIPPED ${result.skipped} ROWS FROM SEDO`);

  return result;
}

async function updateSedoDaily() {
  try{   
    const date = yesterdayYMD(null, process.env.SEDO_TIMEZONE);    
    
    const dailyDomainStats = await getDomainParkingSubIdReport(date);
    console.log('dailyDomainStats', dailyDomainStats)
    await updateData(dailyDomainStats, yesterdayYMD(null, process.env.SEDO_TIMEZONE));
  }
  catch(err) {
    console.log('err', err)
  } 
}
function processSedoData(data){
  return data.map(item => {
    return {
      ...item,
      date: todayYMD(process.env.SEDO_TIMEZONE),
      visitors: Number(item.visitors),
      clicks: Number(item.clicks),
      earnings: Number(item.earnings.replace('USD', '')), // '5.04 USD',
      ctr: Number(item.ctr.replace('%', '')), // '5.04 USD',
      epc: Number(item.epc.replace('USD', '')), // '5.04 USD',
      rpm: Number(item.rpm.replace('USD', '')) // '5.04 USD',
    }
  })

}

async function scrapeAll(browserInstance){
	let browser;
	try{
		browser = await browserInstance;
		let sedoTodayData = await pageScraper.scraper(browser);	
    
    sedoTodayData = processSedoData(sedoTodayData)
    const date = todayYMD(process.env.SEDO_TIMEZONE);
    await updateSedoDomainData(sedoTodayData, date)
    
	}
	catch(err){
		console.log("Could not resolve the browser instance => ", err);
	}
}

async function updateSedoTodayDaily() {
  //Start the browser and create a browser instance
  let browserInstance = browserObject.startBrowser();
  // Pass the browser instance to the scraper controller
  scrapeAll(browserInstance)
}

module.exports = {
  updateSedoDaily,
  updateSedoTodayDaily
}