class AccessToken {
  constructor(
    access_token,
    refresh_token,
    expires_at,
    user_id
  ) {
    this.access_token = access_token;
    this.refresh_token = refresh_token;
    this.expires_at = new Date(expires_at * 1000); // expires_at is a UNIX timestamp
    this.user_id = user_id;
  }
}

module.exports = AccessToken
