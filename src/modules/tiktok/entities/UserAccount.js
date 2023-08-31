class UserAccount {
  constructor(
    id,
    name,
    email,
    image_url,
    provider,
    provider_id,
    status,
    token,
    user_id,
    created_at,
    updated_at,
    business_scoped_id
  ) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.image_url = image_url || ""; // default value is an empty string
    this.provider = provider || "unknown"; // default value is 'unknown'
    this.provider_id = provider_id;
    this.status = status;
    this.token = token;
    this.user_id = user_id;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.business_scoped_id = business_scoped_id || ""; // default value is an empty string
  }
}

module.exports = UserAccount;
