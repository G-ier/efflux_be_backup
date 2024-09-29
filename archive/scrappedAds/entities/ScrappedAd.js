class ScrappedAd {

  constructor(
    id,
    created_at,
    updated_at,
    ad_archive_id,
    primary_text,
    publisher_identifier,
    publisher_type,
    publisher_name,
    starting_date,
    status,
    keywords,
    link,
    landing_url,
    network,
    cta,
  ) {
    this.id = id;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.ad_archive_id = ad_archive_id;
    this.primary_text = primary_text;
    this.publisher_identifier = publisher_identifier;
    this.publisher_type = publisher_type;
    this.publisher_name = publisher_name;
    this.starting_date = starting_date;
    this.status = status;
    this.keywords = keywords;
    this.link = link;
    this.landing_url = landing_url;
    this.network = network;
    this.cta = cta;
  }

}

module.exports = ScrappedAd;
