const express = require('express');
const crypto = require('crypto');
const base64 = require('urlsafe-base64');
const querystring = require('querystring');
const axios = require('axios');
const JOSEWrapper = require('@idpartner/jose-wrapper');
const cookieParser = require('cookie-parser');

const clientId = 'ed3f0ba224eb7c92e3b4629bf87b44bb';
const clientSecret = 'ed3f0ba224eb7c92e3b4629bf87b44bbed3f0ba224eb7c92e3b4629bf87b44bbed3f0ba224eb7c92e3b4629bf87b44bb';
const redirectUri = 'http://localhost:3001/button/oauth/callback';
const scope = 'openid offline_access email profile birthdate address';

// Generate random values for state, nonce, and verifier
const state = crypto.randomBytes(16).toString('hex');
const nonce = crypto.randomBytes(16).toString('hex');
const verifier = base64.encode(crypto.randomBytes(32));
const challenge = base64.encode(crypto.createHash('sha256').update(verifier).digest());

const app = express();
app.use(cookieParser());

// Endpoint to initiate the OAuth process
app.get('/button/oauth', async (req, res) => {
  const { iss, idp_id: idpId } = req.query;
  if (iss) {
    res.cookie('iss', iss, { maxAge: 900000, httpOnly: true });
    // Build query parameters for the authorization request
    const queryParams = querystring.stringify({
      redirect_uri: redirectUri,
      code_challenge_method: "S256",
      code_challenge: challenge,
      state,
      nonce,
      scope,
      client_id: clientId,
      identity_provider_id: idpId,
      prompt: 'consent',
      response_type: "code",
      response_mode: "jwt",
    });

    // Redirect the user to the authorization URL
    return res.redirect(`${iss}/auth?${queryParams}`);
  } else {
    // bank selection
    return res.redirect(`https://auth-api.idpartner.com/oidc-proxy/auth/select-accounts?client_id=${clientId}&scope=${scope}`)
  }
});

// Callback endpoint called after the user completes the authorization process
app.get('/button/oauth/callback', async (req, res) => {
  const decodedToken = await JOSEWrapper.verifyJWS({ jws: req.query.response, issuerURL: req.cookies.iss });

  // Create the credentials for Basic Authorization header
  const credentials = `${clientId}:${clientSecret}`;
  const encodedCredentials = Buffer.from(credentials).toString('base64');

  // Prepare the payload, headers, and data for the token exchange request
  const payload = {
    grant_type: 'authorization_code',
    code: decodedToken.code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  };

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Authorization': `Basic ${encodedCredentials}`,
  };

  const data = querystring.stringify(payload);

  // Send the token exchange request using Axios
  axios.post(`${req.cookies.iss}/token`, data, { headers }).then(response => {
    const tokenData = response.data;
    console.log('Token response:', tokenData);
    return res.status(200).json(tokenData);
  }).catch(error => {
    console.error(error);
    return res.status(500).json(`Token exchange request failed: ${error}`);
  });
});

app.listen(3001, () => console.log('Server started on port 3001'));
