import React, { Component } from 'react';
import { Base64 } from 'js-base64';
import firebase from 'firebase';

export default class ConfirmNewUser extends Component {
	
	constructor(props) {
		super(props);
		
		this.state = {
			type: props.props.match.params.type,
			uid: props.props.match.params.uid,
			name: props.props.match.params.name,
			email: props.props.match.params.email,
			profile: props.profile
		};
		
		// Get a reference to the database service
		this.db = firebase.firestore();
		const settings = {timestampsInSnapshots: true};
		this.db.settings(settings);
	}
	
	componentWillReceiveProps(nextProps) {
		this.setState({
			profile: nextProps.profile
		});
	}
	
	handleConfirm = () => {
		var newRef;
		
		if (this.state.type === 'admin') {
			newRef = this.db.collection('admins').doc(this.state.uid);
		} else if (this.state.type === 'user') {
			newRef = this.db.collection('users').doc(this.state.uid);
		}
		
		newRef.set({name: this.state.name, email: this.state.email}).then(() => {
			this.sendConfirmation();
		}).catch((error) => {
			alert('We could not put the update through. You may not have permission.');
		});
	};
	
	linkPath = () => {
		return window.location.origin;
	}
	
 	sendConfirmation = () => {
		this.sendMessage(
			{
				'To': this.state.email,
				'Subject': 'Request Confirmation'
			},
			'Hello,\n\n' +
			'Your request was approved by ' + this.state.profile.name + '\n' +
			'Click the link below to login:\n' +
			this.linkPath()
		);
	};
	
	sendMessage = (headers_obj, message) => {
		var email = '';

		for (var header in headers_obj) {
			email += header + ": " + headers_obj[header] + "\r\n";
		}
		
		email += "\r\n" + message;
		
		// Using the js-base64 library for encoding:
		// https://www.npmjs.com/package/js-base64
		var base64EncodedEmail = Base64.encodeURI(email);
		var request = window.gapi.client.gmail.users.messages.send({
			'userId': 'me',
			'resource': {
				'raw': base64EncodedEmail
			}
		});
		request.execute((response) => {
			if (response.id !== undefined) {
				alert('A confirmation email has been sent!');
			} else {
				alert('A confirmation email could not be sent at this time.');
			}
		});
	}
	
	render() {
		return (
			<div>
				<p>You have opened a request link.</p>
				<p>Would you like to create the following user?</p>
				
				<table style={{width: '100%'}}>
					<colgroup>
						<col span="1" style={{width: '30%'}} />
						<col span="1" style={{width: '70%'}} />
					</colgroup>
					<tbody>
						<tr>
							<th>Type</th>
							<td>{this.state.type}</td>
						</tr>
						<tr>
							<th>UID</th>
							<td>{this.state.uid}</td>
						</tr>
						<tr>
							<th>Name</th>
							<td>{this.state.name}</td>
						</tr>
						<tr>
							<th>Email</th>
							<td>{this.state.email}</td>
						</tr>
					</tbody>
				</table>
				
				<div style={{'textAlign': 'center'}}>
					<button style={{width: '150px', height: '30px', float: 'center'}} onClick={this.handleConfirm}>Approve Request</button>
				</div>
			</div>
		);
	}
}
