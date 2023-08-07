## POC for OAuth flow using mTLS

Follow next steps to execute the POC:

1. Run: `yarn install`
1. Start ngrok pointing to localhost:3001, grab the url: `ngrok 3001`
1. Create a tls_cleint_auth app in console.idpartner.com using the ngrok url:
   origin: <ngrok_url>/button/oauth
   callback: <ngrok_url>/button/oauth/callback
1. Create a private key for your applciation using its client_id:
   `openssl req -new -newkey rsa:2048 -nodes -keyout <client_id>.key -out <client_id>_<epoch_in_millis>.csr -subj "/CN=<client_id>" -sha256`
1. Create a certificate, by sending your csr file to idpartner via email: engineering-external@idpartner.com
1. Replace clientId and redirectUri vars in the app.js file
1. Replace the paths to the cert and key files in the app.js file
1. Run: `npx nodemon app.js`
1. Access <ngrok_url>/button/oauth


Note: To obtain the userinfo you need to use the mTLS userinfo endpoint (https://mtls-auth.idpartner.com/oidc/me) mentioned [here](https://auth.idpartner.com/oidc/.well-known/openid-configuration)
