const express = require('express');
const crypto = require('crypto');
const base64 = require('urlsafe-base64');
const querystring = require('querystring');
const axios = require('axios');

const clientId = "8036ffddb8811020dbf3eb507d1949a9";
const clientSecret = "8036ffddb8811020dbf3eb507d1949a9-8036ffddb8811020dbf3eb507d1949a9-8036ffddb8811020dbf3eb507d1949a9";
const redirectUri = "https://idpartner-rp2.ngrok.io/button/oauth/callback";

// Generate random values for state, nonce, and verifier
const state = crypto.randomBytes(16).toString('hex');
const nonce = crypto.randomBytes(16).toString('hex');
const verifier = base64.encode(crypto.randomBytes(32));
const challenge = base64.encode(crypto.createHash('sha256').update(verifier).digest());

const app = express();

// Endpoint to initiate the OAuth process
app.get('/button/oauth', async (req, res) => {
  // Construct query parameters for the authorization request
  const queryParams = querystring.stringify({
    redirect_uri: redirectUri,
    code_challenge_method: "S256",
    code_challenge: challenge,
    state,
    nonce,
    scope: "openid offline_access email profile birthdate address",
    client_id: clientId,
    client_secret: clientSecret,
    identity_provider_id: 1, // mikomo
    prompt: 'consent',
    response_type: "code",
  });

  // Redirect the user to the authorization URL
  const authUrl = `https://auth.idpartner.com/oidc/auth?${queryParams}`;
  res.redirect(authUrl);
});

// Callback endpoint called after the user completes the authorization process
app.get('/button/oauth/callback', async (req, res) => {
  const { code } = req.query;

  // Create the credentials for Basic Authorization header
  const credentials = `${clientId}:${clientSecret}`;
  const encodedCredentials = Buffer.from(credentials).toString('base64');

  // Log the curl command for testing purposes
  console.log(`curl -X POST -H "Content-Type: application/x-www-form-urlencoded" -H "Authorization: Basic ${encodedCredentials}" -d 'grant_type=authorization_code&code=${code}&redirect_uri=${redirectUri}&code_verifier=${verifier}' https://auth.idpartner.com/oidc/token`);

  // Prepare the payload, headers, and data for the token exchange request
  const payload = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  };

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${encodedCredentials}`,
  };

  const data = querystring.stringify(payload);

  // Send the token exchange request using Axios
  axios.post('https://auth.idpartner.com/oidc/token', data, { headers })
    .then((response) => {
      const tokenData = response.data;
      console.log('Token response:', tokenData);
      return res.status(200).json(tokenData);
    })
    .catch((error) => {
      console.error(error);
      return res.status(500).json(`Token exchange request failed: ${error}`);
    });
});

app.listen(3001, () => console.log('Server started on port 3001'));
