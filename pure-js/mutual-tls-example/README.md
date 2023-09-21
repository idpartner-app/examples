# POC for OIDC mTLS flow using pure JS

## Running the project

1. [Create an IDPartner Account](https://console.idpartner.com).
1. [Create an Application (tls_client_auth)](https://docs.idpartner.com/documentation/relying-party-user-guide/registering-your-app#create-an-application).
1. Ensure the following properties are set:
   - Origin URL: http://localhost:3001/auth
   - Redirect URL: http://localhost:3001/auth/callback
1. Grab the client_id, for next steps.
1. Create a private key for your application using its client_id:
   `openssl req -new -newkey rsa:2048 -nodes -keyout <client_id>.key -out <client_id>_<epoch_in_millis>.csr -subj "/CN=<client_id>" -sha256`
1. Create a certificate, by sending your csr file to idpartner via email: engineering-external@idpartner.com
1. Run: `yarn install`
1. Replace the clientId constant in the [app.js](./app.js) file
1. Replace the paths to the certificate and key files in the [app.js](./app.js) file
1. Run: `yarn start`
1. Access http://localhost:3001/button/oauth, search for mikomo bank and use test creds `mikomo_10/mikomo_10`

Note: To obtain the userinfo you need to use the mTLS userinfo endpoint (https://mtls-auth.idpartner.com/oidc/me) mentioned [here](https://auth.idpartner.com/oidc/.well-known/openid-configuration)
