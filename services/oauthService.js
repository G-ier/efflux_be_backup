const axios = require("axios");
const { FB_API_URL } = require("../constants/facebook");
const { google } = require("googleapis");

const oauthProviders = ['facebook', 'google'];

async function getFacebookLongToken(accessToken) {
  const { data } =  await axios.get(`${FB_API_URL}oauth/access_token`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      fb_exchange_token: accessToken,
    }
  }).catch(err => {
    console.error("Error fetching facebook long token", err);
  });
  return data.access_token;
}

async function getGoogleTokens(code) {
  console.log('get google refresh token', code)

  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  const { tokens } = await auth.getToken(code);
  return tokens;
}

async function getGoogleAccount(access_token) {
  const { data } = await google.oauth2('v2').userinfo.get({
    access_token,
  });
  return data;
}

function getGoogleAccessToken(refresh_token) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  auth.setCredentials({ refresh_token });

  return auth.getAccessToken();
}

async function getAuth0AccessToken() {
  const { data, status } = await axios.post(
    `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
    {
      client_id: process.env.AUTH0_CLIENT_ID,
      client_secret: process.env.AUTH0_CLIENT_SECRET,
      audience: process.env.AUTH0_API,
      grant_type: "client_credentials",
    }, {
      headers: { "content-type": "application/json" },
    }
  ).catch((err) => {
    console.error('Error fetching Auth0 access token', err);
  });

  if (status !== 200) {
    return null;
  };

  const { access_token, token_type } = data;
  return `${token_type} ${access_token}`
}

async function getAuth0User(sub) {
  const Authorization = await getAuth0AccessToken();

  const { data: user } = await axios.get(
    `${process.env.AUTH0_API}users/${sub}`,
    {
      headers: {
        Authorization,
      },
    }
  );

  return user;
}

async function createAuth0User({ email, password }) {
  const Authorization = await getAuth0AccessToken();
  return axios.post(
    `${process.env.AUTH0_API}users`,
    {
      email,
      password,
      connection: 'Username-Password-Authentication',
    },
    {
      headers: {
          Authorization,
        },
      }
    );
}

function getUserIdentity(userFromAuth0) {
  const oauthIdentity = userFromAuth0.identities.find((identity) => oauthProviders.indexOf(identity.provider) !== -1)
  const auth0Identity = userFromAuth0.identities.find((identity) => identity.provider === 'auth0');

  return {
    provider: oauthIdentity ? oauthIdentity.provider : 'auth0',
    providerId: oauthIdentity ? oauthIdentity.user_id : auth0Identity.user_id,
  }
}

async function revokeGoogleToken(token) {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  await auth.revokeToken(token)
}

async function revokeFacebookToken(token, userId) {
  await axios.delete(`${FB_API_URL}${userId}/permissions`, {
    params: {
      grant_type: 'fb_exchange_token',
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      fb_exchange_token: token,
    }
  })
}

module.exports = {
  getFacebookLongToken,
  getGoogleTokens,
  getGoogleAccount,
  getGoogleAccessToken,
  getAuth0AccessToken,
  getAuth0User,
  createAuth0User,
  getUserIdentity,
  revokeGoogleToken,
  revokeFacebookToken
}
