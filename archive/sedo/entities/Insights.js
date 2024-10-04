class Insights {
  constructor(
    date,
    domain,
    visitors,
    clicks,
    revenue,
    sub1,
    sub2,
    sub3,
    campaign_id,
    adset_id
  ) {
    this.date = date;
    this.domain = domain;
    this.visitors = visitors;
    this.clicks = clicks;
    this.revenue = revenue;
    this.sub1 = sub1;
    this.sub2 = sub2;
    this.sub3 = sub3;
    this.campaign_id = campaign_id;
    this.adset_id = adset_id;
  }
}

module.exports = Insights;
