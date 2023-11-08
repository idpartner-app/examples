const express = require('express');
const https = require('https');
const fs = require('fs');
const crypto = require('crypto');
const base64 = require('urlsafe-base64');
const querystring = require('querystring');
const axios = require('axios');
const JOSEWrapper = require('@idpartner/jose-wrapper');
const { v4: uuidv4 } = require('uuid');
const config = require('../config.json');

const state = crypto.randomBytes(16).toString('hex');
const nonce = crypto.randomBytes(16).toString('hex');
const verifier = base64.encode(crypto.randomBytes(32));
const challenge = base64.encode(crypto.createHash('sha256').update(verifier).digest());

// Load certificate and key for mutual TLS
const clientCert = fs.readFileSync(`./certs/${config.client_id}.pem`);
const clientKey = fs.readFileSync(`./certs/${config.client_id}.key`);

const router = express.Router();
const httpsAgent = new https.Agent({
  cert: clientCert,
  key: clientKey,
});

router.get('/', async (_req, res, next) => {
  try {
    return res.render('index', { title: 'RP Mutual TLS Example using node-oidc-client', config });
  } catch (error) {
    return next(error);
  }
});

router.get('/button/oauth', async (req, res, next) => {
  try {
    const { iss, idp_id: idpId, visitor_id: visitorId } = req.query;
    if (iss) {
      req.session.issuer = iss;
      // Fetch the OpenID Connect Discovery document from the provided issuer URL
      const discoveryResponse = await axios.get(`${req.session.issuer}/.well-known/openid-configuration`);
      const discoveryData = discoveryResponse.data;

      // Obtain the endpoints from the discovery data
      const mtlsPAREndpoint = discoveryData.mtls_endpoint_aliases.pushed_authorization_request_endpoint;

      // Build query parameters for the authorization request
      const payload = {
        client_id: config.client_id,
        code_challenge: challenge,
        code_challenge_method: 'S256',
        identity_provider_id: idpId,
        nonce: nonce,
        prompt: 'consent',
        redirect_uri: config.redirect_uri,
        response_mode: 'jwt',
        response_type: 'code',
        scope: config.scope,
        state: state,
        'x-fapi-interaction-id': uuidv4()
      };

      // Make a POST request to the PAR endpoint
      const parResponse = await axios.post(mtlsPAREndpoint, querystring.stringify(payload), { httpsAgent });

      // Assuming the PAR response contains a request URI
      const { request_uri } = parResponse.data;
      const queryParams = new URLSearchParams({ request_uri });

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
    const mTlsUserinfoEndpoint = discoveryData.mtls_endpoint_aliases.userinfo_endpoint;
    const mTlsTokenEndpoint = discoveryData.mtls_endpoint_aliases.token_endpoint;

    const decodedToken = await JOSEWrapper.verifyJWS({ jws: req.query.response, issuerURL: req.session.issuer });

    const payload = {
      client_id: config.client_id,
      code: decodedToken.code,
      code_verifier: verifier,
      grant_type: 'authorization_code',
      redirect_uri: config.redirect_uri,
    };

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
