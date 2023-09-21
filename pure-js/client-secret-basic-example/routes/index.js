const express = require('express');
const crypto = require('crypto');
const base64 = require('urlsafe-base64');
const querystring = require('querystring');
const axios = require('axios');
const JOSEWrapper = require('@idpartner/jose-wrapper');

const clientId = 'CHANGE_ME_CLIENT_ID';
const clientSecret = 'CHANGE_ME_CLIENT_SECRET';
const redirectUri = 'http://localhost:3001/button/oauth/callback';
const scope = 'openid offline_access email profile birthdate address';

// Generate random values for state, nonce, and verifier
const state = crypto.randomBytes(16).toString('hex');
const nonce = crypto.randomBytes(16).toString('hex');
const verifier = base64.encode(crypto.randomBytes(32));
const challenge = base64.encode(crypto.createHash('sha256').update(verifier).digest());

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    return res.render('index', { title: 'RP Example' });
  } catch (error) {
    return next(error);
  }
});

router.get('/button/oauth', async (req, res, next) => {
  try {
    const { iss, idp_id: idpId, visitor_id: visitorId } = req.query;

    if (iss) {
      req.session.issueruer = iss;
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
      return res.redirect(`https://auth-api.idpartner-dev.com/oidc-proxy/auth/select-accounts?client_id=${clientId}&visitor_id=${visitorId}&scope=${scope}`)
    }
  } catch (error) {
    return next(error);
  }
});

router.get('/button/oauth/callback', async (req, res, next) => {
  try {
    const decodedToken = await JOSEWrapper.verifyJWS({ jws: req.query.response, issuerURL: req.session.issuer });

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
    const response = await axios.post(`${req.session.issuer}/token`, data, { headers })
    const tokenData = response.data;

    // Fetch the OpenID Connect Discovery document from the provided issuer URL
    const discoveryResponse = await axios.get(`${req.session.issuer}/.well-known/openid-configuration`);
    const discoveryData = discoveryResponse.data;

    // Obtain the userinfo_endpoint from the discovery data
    const userinfoEndpoint = discoveryData.userinfo_endpoint;

    // Now, use the access_token to get user info from the dynamically obtained userinfo endpoint
    const userInfoResponse = await axios.get(userinfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    const userInfo = userInfoResponse.data;
    return res.json(userInfo);

  } catch (error) {
    return next(error);
  }
});

module.exports = router;
