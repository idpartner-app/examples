const express = require('express');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const base64 = require('urlsafe-base64');
const querystring = require('querystring');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const JOSEWrapper = require('@idpartner/jose-wrapper');
const cookieParser = require('cookie-parser');

const clientId = 'Xgjrh5jZum-Ptjb84Priv';
const redirectUri = 'http://localhost:3001/button/oauth/callback';
const scope = 'openid offline_access email profile birthdate address';

const state = crypto.randomBytes(16).toString('hex');
const nonce = crypto.randomBytes(16).toString('hex');
const verifier = base64.encode(crypto.randomBytes(32));
const challenge = base64.encode(crypto.createHash('sha256').update(verifier).digest());

// Load client certificates
const clientCert = fs.readFileSync('./Xgjrh5jZum-Ptjb84Priv.pem');
const clientKey = fs.readFileSync('./Xgjrh5jZum-Ptjb84Priv.key');

const app = express();
app.use(cookieParser());

app.get('/button/oauth', async (req, res) => {
  const { iss, idp_id: idpId } = req.query;
  if (iss) {
    res.cookie('iss', iss, { maxAge: 900000, httpOnly: true });  // maxAge set to 15 mins here as an example
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

app.get('/button/oauth/callback', async (req, res) => {
  const issFromCookie = req.cookies.iss;
  const { response } = req.query;
  const decodedToken = await JOSEWrapper.verifyJWS({ jws: response, issuerURL: issFromCookie });
  const code = decodedToken.code;

  const payload = {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
    client_id: clientId,
  };

  const data = querystring.stringify(payload);

  axios.post('https://mtls-auth.idpartner.com/oidc/token', data, {
    httpsAgent: new https.Agent({
      cert: clientCert,
      key: clientKey,
      rejectUnauthorized: true,
    }),
  }).then(response => {
    const tokenData = response.data;
    console.log('Token response:', tokenData);
    return res.status(200).json(tokenData);
  }).catch(error => {
    console.error(error);
    return res.status(500).json(`Token exchange request failed: ${error}`);
  });
});

app.listen(3001, () => console.log('Server started on port 3001'));
