const express = require('express');
const IDPartner = require('@idpartner/node-oidc-client');
const fs = require('fs');

const router = express.Router();

const idPartner = new IDPartner({
  client_id: 'CHANGE_ME_CLIENT_ID',
  tls_client_cert: fs.readFileSync('./certs/CHANGE_ME_CLIENT_ID.pem'),
  tls_client_key: fs.readFileSync('./certs/CHANGE_ME_CLIENT_ID.key'),
  token_endpoint_auth_method: 'tls_client_auth',
  callback: 'http://localhost:3001/button/oauth/callback',
});

router.get('/', async (_req, res, next) => {
  try {
    return res.render('index', { title: 'RP Example' });
  } catch (error) {
    return next(error);
  }
});

router.get('/button/oauth', async (req, res, next) => {
  try {
    const scope = ['openid', 'offline_access', 'email', 'profile', 'birthdate address'];
    const prompt = 'consent';
    req.session.idp_proofs = idPartner.generateProofs();
    req.session.issuer = req.query.iss;

    const authorizationUrl = await idPartner.getAuthorizationUrl(req.query, req.session.idp_proofs, scope, prompt);

    return res.redirect(authorizationUrl);
  } catch (error) {
    return next(error);
  }
});

router.get('/button/oauth/callback', async (req, res, next) => {
  try {
    const token = await idPartner.token(req.url, req.session.issuer, req.session.idp_proofs);
    const claims = await idPartner.userInfo(req.session.issuer, token);

    return res.json(claims);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
