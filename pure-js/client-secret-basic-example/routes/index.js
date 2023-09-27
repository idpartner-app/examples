const express = require('express');
const crypto = require('crypto');
const base64 = require('urlsafe-base64');
const querystring = require('querystring');
const axios = require('axios');
const JOSEWrapper = require('@idpartner/jose-wrapper');
const { v4: uuidv4 } = require('uuid');
const config = require('../config.json');

const scope = 'openid offline_access email profile birthdate address';

// Generate random values for state, nonce, and verifier
const state = crypto.randomBytes(16).toString('hex');
const nonce = crypto.randomBytes(16).toString('hex');
const verifier = base64.encode(crypto.randomBytes(32));
const challenge = base64.encode(crypto.createHash('sha256').update(verifier).digest());

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    return res.render('index', { title: 'RP Client Secret Example', config });
  } catch (error) {
    return next(error);
  }
});

router.get('/button/oauth', async (req, res, next) => {
  try {
    const { iss, idp_id: idpId, visitor_id: visitorId } = req.query;
    if (iss) {
      req.session.issuer = iss;
      // Build query parameters for the authorization request
      const queryParams = querystring.stringify({
        client_id: config.client_id,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        identity_provider_id: idpId,
        nonce: nonce,
        prompt: 'consent',
        redirect_uri: config.redirect_uri,
        response_mode: 'jwt',
        response_type: 'code',
        scope: scope,
        state: state,
        'x-fapi-interaction-id': uuidv4()
      });

      // Redirect the user to the authorization URL
      return res.redirect(`${iss}/auth?${queryParams}`);
    } else {
      // bank selection
      return res.redirect(`https://auth-api.idpartner.com/oidc-proxy/auth/select-accounts?client_id=${config.client_id}&visitor_id=${visitorId}&scope=${scope}`)
    }
  } catch (error) {
    return next(error);
  }
});


router.get('/button/oauth/callback', async (req, res, next) => {
  try {
    // Fetch the OpenID Connect Discovery document from the provided issuer URL
    const discoveryResponse = await axios.get(`${req.session.issuer}/.well-known/openid-configuration`);
    const discoveryData = discoveryResponse.data;

    // Obtain the endpoints from the discovery data
    const tokenEndpoint = discoveryData.token_endpoint;
    const userinfoEndpoint = discoveryData.userinfo_endpoint;

    const decodedToken = await JOSEWrapper.verifyJWS({ jws: req.query.response, issuerURL: req.session.issuer });

    // Create the credentials for Basic Authorization header
    const credentials = `${config.client_id}:${config.client_secret}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');

    // Prepare the payload, headers, and data for the token exchange request
    const payload = {
      code: decodedToken.code,
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: config.redirect_uri,
    };

    // Send the token exchange request using Axios
    const tokenResponse = await axios.post(tokenEndpoint, querystring.stringify(payload), {
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    })
    const tokenData = tokenResponse.data;

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
