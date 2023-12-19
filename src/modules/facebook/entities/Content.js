class Content {
    constructor(
      type,
      url,
      hash,
      created_at,
      updated_at,
      ad_account_id // Assuming you also want to link the content to an ad account
    ) {
      this.type = type;
      this.url = url;
      this.hash = hash;
      this.created_at = created_at;
      this.updated_at = updated_at;
      this.ad_account_id = ad_account_id;
    }
  }
  
  module.exports = Content;
  