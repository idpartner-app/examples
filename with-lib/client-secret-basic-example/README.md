# POC for OIDC client_secret_basic flow using node-oidc-client lib

## Prerequisites

1. [Create an IDPartner Account](https://console.idpartner.com).
1. [Create an Application (Client Secret)](https://docs.idpartner.com/documentation/relying-party-user-guide/registering-your-app#create-an-application).
1. Ensure the following properties are set:
   - Origin URL: http://localhost:3001/auth
   - Redirect URL: http://localhost:3001/auth/callback
1. Grab the "Client ID" and the "Client Secret" to update the following parts in your code:
   1. [Update CHANGE_ME_CLIENT_ID in custom html](./views/index.ejs)
   1. [Update CHANGE_ME_CLIENT_ID in confidential client](./routes/index.js)
   1. [Update CHANGE_ME_CLIENT_SECRET in confidential client](./routes/index.js)

   Aditionally you optionally can configure the next steps:
   1. [Update callback in confidential client](./routes/index.js)
   1. [Update CHANGE_ME_COOKIE_SECRET for the cookie session](./app.js).

## Running the project

1. Run: `yarn install`
1. Run: `yarn start`
1. Access http://localhost:3001
1. Click the "Choose your ID Partner" button
1. Search for "Mikomo Bank"
1. Use these test credentials `mikomo_10/mikomo_10`

Note: To obtain the userinfo you need to use the mTLS userinfo endpoint (https://mtls-auth.idpartner.com/oidc/me) mentioned [here](https://auth.idpartner.com/oidc/.well-known/openid-configuration)
