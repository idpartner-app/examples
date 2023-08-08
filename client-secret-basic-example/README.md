## POC for OAuth flow using client_secret_basic

Follow next steps to execute the POC:

1. Run: `yarn install`
1. Create a client_secret_basic app (sandbox) in console.idpartner.com using the ngrok url:
   origin: http://localhost:3001/button/oauth
   callback: http://localhost:3001/button/oauth/callback
1. Replace the clientId and the clientSecret constants in the app.js file
1. Run: `npx nodemon app.js`
1. Access http://localhost:3001/button/oauth, search for mikomo bank and use test creds `mikomo_10/mikomo_10`
