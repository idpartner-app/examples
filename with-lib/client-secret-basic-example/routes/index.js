const express = require('express');
const IDPartner = require('@idpartner/node-oidc-client');

const router = express.Router();
const config = require('../config.json');

const idPartner = new IDPartner({
  callback: config.redirect_uri,
  client_id: config.client_id,
  client_secret: config.client_secret,
});

router.get('/', async (_req, res, next) => {
  try {
    return res.render('index', { title: 'RP Client Secret Example using node-oidc-client', config });
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
