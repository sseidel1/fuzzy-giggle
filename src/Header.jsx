import React, { Component } from 'react';
import './Header.css';

export default class Header extends Component {
	
	constructor(props) {
		super(props);
		
		this.handleSignIn = props.handleSignIn;
		this.handleSignOut = props.handleSignOut;
		this.handleAuthorize = props.handleAuthorize;
		this.handleRevoke = props.handleRevoke;
		
		this.state = {
			isAuthorized: props.isAuthorized,
			isSignedIn: props.isSignedIn,
			profile: props.profile
		};
	}
	
	componentWillReceiveProps(nextProps) {
		this.setState({
			isAuthorized: nextProps.isAuthorized,
			isSignedIn: nextProps.isSignedIn,
			profile: nextProps.profile
		});
	}
	
	signMessage = () => {
		if (this.state.isSignedIn) {
			return 'Sign Out';
		} else {
			return 'Sign In';
		}
	}
	
	authorizeMessage = () => {
		if (this.state.isAuthorized) {
			return 'Revoke';
		} else {
			return 'Authorize';
		}
	}
	
	renderAuthorize = () => {
		if (this.state.isSignedIn) {
			return <button onClick={this.handleAuthorizeClick}>{this.authorizeMessage()}</button>
		}
	}
	
	handleSignClick = () => {
		if (this.state.isSignedIn) {
			this.handleSignOut();
		} else {
			this.handleSignIn();
		}
	}
	
	handleAuthorizeClick = () => {
		if (this.state.isSignedIn) {
			if (this.state.isAuthorized) {
				this.handleRevoke();
			} else {
				this.handleAuthorize();
			}
		}
	}
	
	render() {
		return (
			<div className="Header-div">
				<div className="Header-left">
					<div style={{width: '100px', float: 'left'}}>
						<img src={this.state.profile.imageUrl} alt=''
							style={{width: '100px', height: '100px'}} /> 
					</div>
					<div style={{width: '100%', paddingLeft: '110px'}}>
						<p style={{fontSize: '150%', margin: '0'}}>{this.state.profile.name}</p>
						<p style={{margin: '0'}}>{this.state.profile.email}</p>
					</div>
				</div>
				<div className="Header-right">
					<button onClick={this.handleSignClick}>{this.signMessage()}</button>
					<br />
					{this.renderAuthorize()}
				</div>
			</div>
		);
	}
}
