class User {
  constructor(
    id,
    org_id,
    role_id,
    name,
    email,
    image_url,
    nickname,
    sub,
    acct_type,
    phone,
    token,
    fbID,
    created_at,
    updated_at,
    provider,
    providerId,
  ) {
    this.id = id;
    this.org_id = org_id;
    this.role_id = role_id;
    this.name = name;
    this.email = email;
    this.image_url = image_url;
    this.nickname = nickname;
    this.sub = sub;
    this.acct_type = acct_type;
    this.phone = phone;
    this.token = token;
    this.fbID = fbID;
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.provider = provider;
    this.providerId = providerId;
  }
}

module.exports = User;
