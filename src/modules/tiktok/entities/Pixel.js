class Pixel {
  constructor(
    id,
    pixel_id,
    code,
    name,
    creation_time,
    created_at,
    updated_at,
    category,
    mode,
    status,
    user_id,
    account_id,
    ad_account_id,
    provider_id,
  ) {
    this.id = id;
    this.pixel_id = pixel_id;
    this.code = code;
    this.name = name;
    this.creation_time = creation_time;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.category = category;
    this.mode = mode;
    this.status = status;
    this.user_id = user_id;
    this.account_id = account_id;
    this.ad_account_id = ad_account_id;
    this.provider_id = provider_id;
  }
}

module.exports = Pixel;
