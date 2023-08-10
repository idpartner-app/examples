## POC for OAuth flow using mTLS

Follow next steps to execute the POC:

1. Run: `yarn install`
1. Create a tls_client_auth app (sandbox) in console.idpartner.com:
   origin: http://localhost:3001/button/oauth
   callback: http://localhost:3001/button/oauth/callback
1. Create a private key for your application using its client_id:
   `openssl req -new -newkey rsa:2048 -nodes -keyout <client_id>.key -out <client_id>_<epoch_in_millis>.csr -subj "/CN=<client_id>" -sha256`
1. Create a certificate, by sending your csr file to idpartner via email: engineering-external@idpartner.com
1. Replace the clientId constant in the app.js file
1. Replace the paths to the cert and key files in the app.js file
1. Run: `npx nodemon app.js`
1. Access http://localhost:3001/button/oauth, search for mikomo bank and use test creds `mikomo_10/mikomo_10`


Note: To obtain the userinfo you need to use the mTLS userinfo endpoint (https://mtls-auth.idpartner.com/oidc/me) mentioned [here](https://auth.idpartner.com/oidc/.well-known/openid-configuration)
