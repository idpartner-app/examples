# POC for OIDC mTLS flow using pure JS

## Prerequisites

1. [Create an IDPartner Account](https://console.idpartner.com).
1. [Create an Application (Mutual TLS)](https://docs.idpartner.com/documentation/relying-party-user-guide/registering-your-app#create-an-application).
1. Ensure the following properties are set:
   - Origin URL: http://localhost:3001/button/oauth
   - Redirect URL: http://localhost:3001/button/oauth/callback
1. In the "Certificates" column click on the "+" icon ("add certificate")
1. Generate the CSR file with the given command and upload it
1. The previous step generated a key file, put it in the [certs](./certs) folder
1. Download your certificate and place it in the [certs](./certs) folder
1. Update the paths to the certificate and the key files placed in the [certs](./certs) folder
1. Grab the "Client ID" to update the following parts in your code:
   1. [Update CHANGE_ME_CLIENT_ID in the configuration file](./config.json)
   1. Update the name of your certificate file with your client ID: `CLIENT_ID.pem`
   1. Update the name of your key file with your client ID: `CLIENT_ID.key`

   Aditionally you optionally can configure the next steps:
   1. [Update the "redirect_uri" in the configuration file](./config.json)
   1. [Update CHANGE_ME_COOKIE_SECRET in the configuration file](./config.json)

## Running the project

1. Run: `yarn install`
1. Run: `yarn start`
1. Access http://localhost:3001
1. Click the "Choose your ID Partner" button
1. Search for "Mikomo Bank"
1. Use these test credentials `mikomo_10/mikomo_10`
