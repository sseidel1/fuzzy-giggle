import React, { Component } from 'react';
import { Base64 } from 'js-base64';
import firebase from 'firebase';

export default class NewUser extends Component {
	
	constructor(props) {
		super(props);
		
		this.state = {
			type: 'user',
			uid: props.uid,
			name: props.profile.name,
			email: props.profile.email
		};
		
		// Get a reference to the database service
		this.db = firebase.firestore();
		const settings = {timestampsInSnapshots: true};
		this.db.settings(settings);
	}
	
	componentWillReceiveProps(nextProps) {
		this.setState({
			type: 'user',
			uid: nextProps.uid,
			name: nextProps.profile.name,
			email: nextProps.profile.email
		});
	}
	
	linkPath = () => {
		return window.location.origin + '/new' +
			'/' + encodeURI(this.state.type) +
			'/' + encodeURI(this.state.uid) +
			'/' + encodeURI(this.state.name) +
			'/' + encodeURI(this.state.email);
	}
	
	handleSend = () => {
		this.db.collection('admins').get().then((snapshot) => {
			var toEmails = '';
			snapshot.docs.forEach((doc) => toEmails += doc.data().email + ',')
			this.sendMessage(
				{
					'To': toEmails,
					'Subject': 'New User Request'
				},
				'Hello Admin,\n\n' +
				'Will you add me to the database?\n' +
				'Type: ' + this.state.type + '\n' +
				'UID: ' + this.state.uid + '\n' +
				'Name: ' + this.state.name + '\n' +
				'Email: ' + this.state.email + '\n\n' +
				'Click the link below to accept:\n' +
				this.linkPath()
			);
		}).catch((error) => {
			console.log(error);
		});
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
		request.execute(() => {
			alert('A request email has been sent!');
		});
	}
	
	render() {
		return (
			<div>
				<p>Your email does not exist in the database. Let's do something about it!</p>
				<p>You can send an email request to the admins below:</p>
				
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
					<button style={{width: '150px', height: '30px', float: 'center'}} onClick={this.handleSend}>Send Request</button>
				</div>
			</div>
		);
	}
}
