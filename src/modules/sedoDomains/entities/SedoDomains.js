class SedoDomains {
  constructor(data) {
    this.domain = data.domain;
    this.categories = data.categories;
    this.forsale = data.forsale;
    this.price = data.price;
    this.minprice = data.minprice;
    this.fixedprice = data.fixedprice;
    this.currency = data.currency;
    this.domainlanguage = data.domainlanguage;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }
}

module.exports = SedoDomains;
