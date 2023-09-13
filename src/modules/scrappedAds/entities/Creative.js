class Creative {

  constructor(
    id,
    cdn_url,
    creative_url,
    creative_type,
    ad_card_id,
    tags,
  ) {
    this.id = id;
    this.cdn_url = cdn_url;
    this.creative_url = creative_url;
    this.creative_type = creative_type;
    this.ad_card_id = ad_card_id;
    this.tags = tags;
  }

}

module.exports = Creative;
