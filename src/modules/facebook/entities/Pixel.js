class Pixel {
  constructor(
    id,
    user_id,
    account_id,
    name,
    business_id,
    business_name,
    is_unavailable,
    last_fired_time,
    creation_time,
    data_use_setting,
    pixel_id_ad_account_id
  ) {
    this.id = id;
    this.user_id = user_id;
    this.account_id = account_id;
    this.name = name;
    this.business_id = business_id;
    this.business_name = business_name;
    this.is_unavailable = is_unavailable;
    this.last_fired_time = last_fired_time;
    this.creation_time = creation_time;
    this.data_use_setting = data_use_setting;
    this.pixel_id_ad_account_id = pixel_id_ad_account_id;
  }
}

module.exports = Pixel;
