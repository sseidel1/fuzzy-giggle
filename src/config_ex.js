var config = {
	// Client ID and API key from the Developer Console
	CLIENT_ID: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com',
	API_KEY: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
	// Array of API discovery doc URLs for APIs used by the quickstart
	DISCOVERY_DOCS: ["https://sheets.googleapis.com/$discovery/rest?version=v4", "https://www.googleapis.com/discovery/v1/apis/gmail/v1/rest"],
	// Authorization scopes required by the API; multiple scopes can be included, separated by spaces.
	SCOPES: 'https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/spreadsheets'
};

config['FIREBASE'] = {
    apiKey: config.API_KEY,
    authDomain: "xxxxxxxxxxxxxx.firebaseapp.com",
    databaseURL: "https://xxxxxxxxxxxxxx.firebaseio.com",
    projectId: "xxxxxxxxxxxxxx",
    storageBucket: "xxxxxxxxxxxxxx.appspot.com",
    messagingSenderId: "00000000000000"
};

export default config;
