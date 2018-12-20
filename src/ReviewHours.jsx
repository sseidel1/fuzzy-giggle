import React, { Component } from 'react';
import { Base64 } from 'js-base64';
import Calendar from './Calendar';
import firebase from 'firebase';

export default class ReviewHours extends Component {
	
	constructor(props) {
		super(props);
		
		this.state = {
			uid: props.props.match.params.uid,
			success: true,
			submitted: {},
			reviewed: 0,
			name: "",
			email: ""
		};
		
		// Get a reference to the database service
		this.db = firebase.firestore();
		const settings = {timestampsInSnapshots: true};
		this.db.settings(settings);
	}
	
	startHoursListener = () => {
		this.unsubscribeSubmitted = this.db.collection('users').doc(this.state.uid)
			.collection('submitted').onSnapshot((snapshot) => {
			var submitted = {};
			snapshot.docs.forEach((doc) => {
				submitted[doc.id] = {
					...doc.data(),
					approve: false,
					reject: false
				};
			});
			this.setState({
				submitted: submitted,
				reviewed: 0
			});
		});
		this.db.collection('users').doc(this.state.uid).get().then((doc) => {
			if (doc.data() !== null) {
				console.log(doc.data());
				this.setState({
					success: true,
					name: doc.data().name,
					email: doc.data().email
				});
			}
		}).catch((error) => {
			this.setState({
				success: false
			});
			console.log(error);
		});
	}
	
	stopHoursListener = () => {
		this.unsubscribeSubmitted();
	};
	
	componentDidMount = () => {
		this.startHoursListener();
	}
	
	handleApproveSelection = (key) => (event) => {
		let checked = event.target.checked;
		this.setState((prevState) => {
			var submitted = prevState.submitted;
			submitted[key].approve = checked;
			if (checked) submitted[key].reject = false;
			
			var reviewed = 0;
			Object.keys(submitted).map((k, i) => k).forEach((k) => {
				reviewed += (submitted[k].approve || submitted[k].reject ? 1 : 0);
			});
			return {submitted: submitted, reviewed: reviewed};
		});
	};
	
	handleRejectSelection = (key) => (event) => {
		let checked = event.target.checked;
		this.setState((prevState) => {
			var submitted = prevState.submitted;
			submitted[key].reject = checked;
			if (checked) submitted[key].approve = false;
			
			var reviewed = 0;
			Object.keys(submitted).map((k, i) => k).forEach((k) => {
				reviewed += (submitted[k].approve || submitted[k].reject ? 1 : 0);
			});
			return {submitted: submitted, reviewed: reviewed};
		});
	};
	
	handleSubmit = () => {
		// Get a new write batch
		var batch = this.db.batch();
		var emailUpdates = '';
		
		Object.keys(this.state.submitted).map((k, i) => k).sort().forEach((k) => {
			let update = this.state.submitted[k];
			
			var message = '';
			if (update.approve) {
				let dbRef = this.db.collection('users').doc(this.state.uid)
					.collection('year').doc(update.year.toString())
					.collection('month').doc(update.month.toString());
				var hoursUpdate = {};
				hoursUpdate[update.date] = update.hours;
				batch.set(dbRef, hoursUpdate, { merge: true });
				message = 'Approved';
			} else if (update.reject) {
				message = 'Rejected';
			}
			
			if (update.approve || update.reject) {
				let dbRef = this.db.collection('users').doc(this.state.uid)
					.collection('submitted').doc(update.year + '-' + update.month + '-' + update.date);
				batch.delete(dbRef);
				emailUpdates += update.month + '/' + update.date + '/' + update.year + ': ' + update.hours + ' (' + message + ')\n';
			}
		});
		
		// Commit the batch
		batch.commit().then(() => {
			this.setState({
				updates: {}
			});
			this.handleSend(emailUpdates);
		}).catch((error) => {
			console.log(error);
			alert('Failed to submit reviewed hours. You may not have permission.');
		});
	};
	
	handleSend = (emailUpdates) => {
		this.db.collection('admins').get().then((snapshot) => {
			var toEmails = this.state.email + ',';
			snapshot.docs.forEach((doc) => toEmails += doc.data().email + ',')
			this.sendMessage(
				{
					'To': toEmails,
					'Subject': 'Hours Reviewed'
				},
				'Hello Admins & User,\n\n' +
				'The following updates have been reviewed:\n' +
				emailUpdates
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
			alert('Your supervisor has been notified for review!');
		});
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
	
	renderReview = () => {
		var reviewRows = [];
		Object.keys(this.state.submitted).map((k, i) => k).sort().forEach((k) => {
			let review = this.state.submitted[k];
			reviewRows.push(
				<tr>
					<td style={{textAlign: 'center'}}>
						{review.month + 1}/{review.date + 1}/{review.year}
					</td>
					<td style={{textAlign: 'center'}}>
						{review.hours}
					</td>
					<td>
						<div style={{'textAlign': 'center'}}>
							<input type='checkbox' style={{width: '20px', height: '20px'}} onChange={this.handleApproveSelection(k)} checked={review.approve} />
						</div>
					</td>
					<td>
						<div style={{'textAlign': 'center'}}>
							<input type='checkbox' style={{width: '20px', height: '20px'}} onChange={this.handleRejectSelection(k)} checked={review.reject} />
						</div>
					</td>
				</tr>
			);
		});
		
		if (reviewRows.length > 0) {
			var submitButton;
			if (this.state.reviewed) {
				submitButton = (<>
					<p>Submit reviewed entries below:</p>
					<div style={{'textAlign': 'center'}}>
						<button style={{width: '150px', height: '30px'}} onClick={this.handleSubmit}>Submit</button>
					</div>
				</>);
			} else {
				submitButton = (<>
					<p>Review entries above</p>
				</>);
			}
			
			return (
				<div>
					<p>The following updates have been submitted for review:</p>
					<table style={{width: '100%'}}>
						<colgroup>
							<col span="1" style={{width: '25%'}} />
							<col span="1" style={{width: '25%'}} />
							<col span="1" style={{width: '25%'}} />
							<col span="1" style={{width: '25%'}} />
						</colgroup>
						<tbody>
							<tr>
								<th>Date</th>
								<th>Updated Hours</th>
								<th>Approve</th>
								<th>Reject</th>
							</tr>
							{reviewRows}
						</tbody>
					</table>
					{submitButton}
				</div>
			);
		}
	};
	
	render() {
		if (this.state.success) {
			return (
				<div>
					<div style={{'textAlign': 'center'}}>
						<h3>Review Hours</h3>
					</div>
					<p>Please approve or reject the hours entries listed below for the following user:</p>
					
					<table style={{width: '100%'}}>
						<colgroup>
							<col span="1" style={{width: '30%'}} />
							<col span="1" style={{width: '70%'}} />
						</colgroup>
						<tbody>
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
					<Calendar uid={this.state.uid} editable={false} />
					{this.renderReview()}
				</div>
			);
		} else {
			return (
				<div>
					<p>Approval unsuccessful. You may not have permission to view this user.</p>
				</div>
			);
		}
	}
}
