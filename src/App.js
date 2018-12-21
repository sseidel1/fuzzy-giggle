import React, { Component } from 'react';
import {BrowserRouter as Router, Route} from 'react-router-dom';
import Header from './Header';
import AdminDash from './AdminDash';
import UserDash from './UserDash';
import NewUser from './NewUser';
import ConfirmNewUser from './ConfirmNewUser';
import ReviewHours from './ReviewHours';
import Login from './Login';
import firebase from 'firebase';
import config from './config';
import './App.css';

// Initialize Firebase
firebase.initializeApp(config.FIREBASE);

class App extends Component {

	constructor(props) {
		super(props);
		
		this.state = {
			isSignedIn: false,
			isAuthorized: false,
			isNewUser: false,
			isAdmin: false,
			isUser: false,
			profile: {
				name: '',
				email: '',
				imageUrl: ''
			},
			uid: ''
		};
		
		// Get a reference to the database service
		// Get a reference to the database service
		this.db = firebase.firestore();
		const settings = {timestampsInSnapshots: true};
		this.db.settings(settings);
	}

    componentDidMount() {
		firebase.auth().onAuthStateChanged((user) => {
			console.log('Auth state changed');
			this.setState({
				uid: user.uid
			});
			
			let isSignedIn = !!user;
			this.setState({isSignedIn: isSignedIn});
			
			if (isSignedIn) {
				let checkExistsRef = this.db.collection('check').doc('exists');
				let checkAdminRef = this.db.collection('check').doc('admin');
				let checkUserRef = this.db.collection('check').doc('user');
				checkExistsRef.get().then((doc) => {
					checkAdminRef.get().then((doc) => {
						this.setState({
							isAdmin: true,
							isUser: false,
							isNewUser: false
						});
					}).catch((error) => {});
					checkUserRef.get().then((doc) => {
						this.setState({
							isAdmin:false,
							isUser: true,
							isNewUser: false
						});
					}).catch((error) => {});
				}).catch((error) => {
					this.setState({
						isAdmin:false,
						isUser: false,
						isNewUser: true
					});
				});
			}
		});
		
		// 1. Load the JavaScript client library.
		window.gapi.load('client:auth2', this.initClient);
	}
	
	initClient = () => {
		window.gapi.client.init({
			apiKey: config.API_KEY,
			clientId: config.CLIENT_ID,
			discoveryDocs: config.DISCOVERY_DOCS,
			scope: config.SCOPES
		}).then(() => {
			
			// Listen for sign-in state changes.
			window.gapi.auth2.getAuthInstance().isSignedIn.listen(this.updateSigninStatus);
			
			// Handle the initial sign-in state.
			this.updateSigninStatus(window.gapi.auth2.getAuthInstance().isSignedIn.get());
		}, (error) => {
			console.log(error);
		});
	}
	
	updateSigninStatus = (isSignedIn) => {
		if (isSignedIn) {
			console.log('Signed in');
			let googleUser = window.gapi.auth2.getAuthInstance().currentUser.get();
			let profile = googleUser.getBasicProfile();
			this.setState({
				profile: {
					name: profile.getName(),
					email: profile.getEmail(),
					imageUrl: profile.getImageUrl()
				}
			});
			var credential = firebase.auth.GoogleAuthProvider.credential(googleUser.getAuthResponse().id_token);
			
			// Sign in with credential from the Google user.
			firebase.auth().signInAndRetrieveDataWithCredential(credential).catch((error) => {
				// Handle Errors here.
				console.log(error);
			});
		} else {
			console.log('Not signed in');
			this.handleSignInAndAuth();
		}
	}
	
	handleSignInAndAuth = () => {
		console.log('Handle Auth Click');
		window.gapi.auth2.getAuthInstance().signIn().then((googleUser) => {
		}).catch((error) => {
			console.log(error);
		});
	}
	
    handleSignOut = () => {
		window.gapi.auth2.getAuthInstance().signOut().then(() => {
			console.log('Signed out');
		}).catch((error) => {
			console.log(error);
		});
	}
	
	handleRevoke = () => {
		window.gapi.auth2.getAuthInstance().disconnect();
	};
	
	renderLogin = () => {
		if (!this.state.isSignedIn) {
			return <Login />;
		}
	};
	
	renderNewUser = () => {
		if (this.state.isNewUser) {
			return <Route exact path="/" render={(props) => (
				<NewUser uid={this.state.uid} profile={this.state.profile} />
			)} />;
		}
	};
	
	renderConfirmNewUser = () => {
		return (
			<Route path="/new/:type/:uid/:name/:email/:supervisor/:semester/:year" render={(props) => (
				<div style={{backgroundColor: '#FF0000', padding: '10px'}}>
					<ConfirmNewUser uid={this.state.uid} profile={this.state.profile} props={props} />
				</div>
			)} />
		);
	};
	
	renderAdminDash = () => {
		if (this.state.isAdmin) {
			return <Route exact path="/" render={(props) => (
				<AdminDash />
			)} />;
		}
	};
	
	renderUserDash = () => {
		if (this.state.isUser) {
			return <Route exact path="/" render={(props) => (
				<UserDash uid={this.state.uid} />
			)} />;
		}
	}
	
	renderReviewHours = () => {
		return (
			<Route path="/review/:uid" render={(props) => (
				<ReviewHours props={props} />
			)} />
		);
	}
	
    render() {
        return (
			<Router>
				<div style={{maxWidth: '1200px', 'margin':'auto'}}>
					<header className="App-header">
						<Header
							profile={this.state.profile}
							isSignedIn={this.state.isSignedIn}
							isAuthorized={this.state.isAuthorized}
							handleSignIn={this.handleSignInAndAuth}
							handleSignOut={this.handleSignOut}
							handleAuthorize={this.handleSignInAndAuth}
							handleRevoke={this.handleRevoke}
						/>
					</header>
					<div style={{backgroundColor: '#FCFCFC', padding: '10px'}}>
						<div>
							{this.renderConfirmNewUser()}
						</div>
						<div>
							{this.renderReviewHours()}
						</div>
						<div>
							{this.renderAdminDash()}
						</div>
						<div>
							{this.renderUserDash()}
						</div>
						<div>
							{this.renderLogin()}
						</div>
						<div>
							{this.renderNewUser()}
						</div>
					</div>
				</div>
			</Router>
		);
	}
}

export default App;
