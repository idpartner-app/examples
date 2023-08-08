## POC for OAuth flow using client_secret_basic

Follow next steps to execute the POC:

1. Run: `yarn install`
1. Start ngrok pointing to localhost:3001, grab the url: `ngrok 3001`
1. Create a client_secret_basic app in console.idpartner.com using the ngrok url:
   origin: <ngrok_url>/button/oauth
   callback: <ngrok_url>/button/oauth/callback
1. Replace clientId, clientSecret, and redirectUri vars in the app.js file
1. Run: `npx nodemon app.js`
1. Access <ngrok_url>/button/oauth
