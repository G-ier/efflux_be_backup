const scraperObject = {
	url: 'https://sedo.com/auth/login',  
  parking_tools: 'https://sedo.com/member/parking_tools/overview.php?language=us',
  waitUntil: { waitUntil: ['load','domcontentloaded','networkidle0','networkidle2'] },
	async scraper(browser){
    const CREDS = {
      username: process.env.SEDO_USERNAME || "roixad2",
      password: process.env.SEDO_PASSWORD || "Roi99667"
    }
		let page = await browser.newPage();
    await page.setViewport({width: 1900, height: 720});
    await page.setDefaultNavigationTimeout(0);
		console.log(`Navigating to ${this.url}...`);
    // Navigate to the selected page
		await page.goto(this.url, this.waitUntil);// wait until page load
    await page.type('#username', CREDS.username, {delay: 100});
    await page.type('#password', CREDS.password, {delay: 100});
    // click and wait for navigation    
    try{
      const button = '[name="submit"]';
      await page.waitForSelector(button, {visible: true});
      await page.evaluate((button) => {
        document.querySelector(button).click();
      }, button);      
      await page.waitForNavigation()
      // goto member/parking_tools/overview.php?language=us page 
      await page.goto(this.parking_tools, this.waitUntil);

      const domains = []
      class DomainItem {
        constructor(domain, visitors, clicks, earnings, ctr, epc, rpm) {          
          this.domain = domain
          this.visitors = visitors
          this.clicks = clicks
          this.earnings = earnings
          this.ctr = ctr
          this.epc = epc
          this.rpm = rpm
        }
      }
      const tableSelector = '#overview_table > tbody'
      const domainsLength = await page.$$eval(`${tableSelector} > tr`, el => el?.length)
      // iterate over tr:nth-child(${i}) on all rows
      for (let i = 1; i <= domainsLength ; i++) {        
        const domain = await page.evaluate(el => el?.innerText, await page.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(2)`))
        const visitors = await page.evaluate(el => el?.innerText, await page.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(3)`))
        const clicks = await page.evaluate(el => el?.innerText, await page.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(4)`))
        const earnings = await page.evaluate(el => el?.innerText, await page.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(5)`))
        const ctr = await page.evaluate(el => el?.innerText, await page.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(6)`))
        const epc = await page.evaluate(el => el?.innerText, await page.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(7)`))
        const rpm = await page.evaluate(el => el?.innerText, await page.$(`${tableSelector} > tr:nth-child(${i}) > td:nth-child(8)`))
        if(domain){
          const actualDomainItem = new DomainItem(domain, visitors, clicks, earnings, ctr, epc, rpm)
          domains.push(actualDomainItem)
        }
      }
      await browser.close();
      return domains;
    }
    catch(err) {
      console.log('err', err)
      await browser.close()
    }
    
	}
}

module.exports = scraperObject;