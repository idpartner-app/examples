const express = require('express');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const base64 = require('urlsafe-base64');
const querystring = require('querystring');
const axios = require('axios');
const JOSEWrapper = require('@idpartner/jose-wrapper');

const clientId = 'CHANGE_ME_CLIENT_ID';
const redirectUri = 'http://localhost:3001/button/oauth/callback';
const scope = 'openid offline_access email profile birthdate address';

const state = crypto.randomBytes(16).toString('hex');
const nonce = crypto.randomBytes(16).toString('hex');
const verifier = base64.encode(crypto.randomBytes(32));
const challenge = base64.encode(crypto.createHash('sha256').update(verifier).digest());

// Load client certificates
const clientCert = fs.readFileSync('./certs/CHANGE_ME_CLIENT_ID.pem');
const clientKey = fs.readFileSync('./certs/CHANGE_ME_CLIENT_ID.key');

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
      req.session.issuer = iss;
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
      return res.redirect(`https://auth-api.idpartner.com/oidc-proxy/auth/select-accounts?client_id=${clientId}&visitor_id=${visitorId}&scope=${scope}`)
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

    // Obtain the userinfo_endpoint from the discovery data
    const mTlsUserinfoEndpoint = discoveryData.mtls_endpoint_aliases.userinfo_endpoint;
    const mTlsTokenEndpoint = discoveryData.mtls_endpoint_aliases.token_endpoint;

    const decodedToken = await JOSEWrapper.verifyJWS({ jws: req.query.response, issuerURL: req.session.issuer });

    const payload = {
      grant_type: 'authorization_code',
      code: decodedToken.code,
      redirect_uri: redirectUri,
      code_verifier: verifier,
      client_id: clientId,
    };

    const httpsAgent = new https.Agent({
      cert: clientCert,
      key: clientKey,
      rejectUnauthorized: true,
    });

    const tokenResponse = await axios.post(mTlsTokenEndpoint, querystring.stringify(payload), { httpsAgent });
    const tokenData = tokenResponse.data;

    // Now, use the access_token to get user info from the dynamically obtained userinfo endpoint
    const userInfoResponse = await axios.get(mTlsUserinfoEndpoint, {
      httpsAgent,
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });
    const userInfo = userInfoResponse.data;
    return res.json(userInfo);

  } catch (error) {
    return next(error);
  }
});

module.exports = router;
