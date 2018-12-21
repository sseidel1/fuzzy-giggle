import React, { Component } from 'react';
import { Base64 } from 'js-base64';
import firebase from 'firebase';

let semesters = ['Spring', 'Fall'];

export default class NewUser extends Component {
	
	constructor(props) {
		super(props);
		
		let current = new Date();
		this.state = {
			type: 'user',
			uid: props.uid,
			name: props.profile.name,
			email: props.profile.email,
			supervisor: '',
			semester: semesters[0],
			year: current.getFullYear(),
			validSupervisor: false
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
			'/' + encodeURI(this.state.email) +
			'/' + encodeURI(this.state.supervisor) +
			'/' + encodeURI(this.state.semester) +
			'/' + encodeURI(this.state.year);
	}
	
	handleSupervisorChange = (event) => {
		this.setState({
			supervisor: event.target.value,
			validSupervisor: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(event.target.value)
		});
	}
	
	handleSemesterChange = (event) => {
		this.setState({
			semester: event.target.value
		});
	};
	
	handleYearChange = (event) => {
		this.setState({
			year: parseInt(event.target.value)
		});
	};
	
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
				'Email: ' + this.state.email + '\n' +
				'Supervisor: ' + this.state.supervisor + '\n' +
				'Start Semester: ' + this.state.semester + '\n' +
				'Start Year: ' + this.state.year + '\n\n' +
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
	
	renderSemesterOptions = () => {
		var semesterList = [];
		semesters.forEach((semester) => {
			semesterList.push(<option value={semester}>{semester}</option>);
		});
		return semesterList;
	};
	
	renderYearOptions = () => {
		let current = new Date();
		current.setFullYear(current.getFullYear() - 9);
		let yearLower = current.getFullYear();
		current.setFullYear(current.getFullYear() + 10);
		let yearUpper = current.getFullYear();
		var yearList = [];
		for (var year = yearLower; year <= yearUpper; year++) {
			yearList.push(<option value={year}>{year}</option>);
		}
		return yearList;
	};
	
	renderSubmit = () => {
		if (this.state.validSupervisor) {
			return (
				<div style={{'textAlign': 'center'}}>
					<button style={{width: '150px', height: '30px', float: 'center'}} onClick={this.handleSend}>Send Request</button>
				</div>
			);
		}
	};
	
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
						<tr>
							<th>Supervisor</th>
							<td>
								<input type="text" value={this.state.supervisor} onChange={this.handleSupervisorChange}
									style={{
										width: '150px',
										boxSizing: 'border-box',
										border: (this.state.validSupervisor ? '1px solid #000' : '2px solid #f00')
									}}
								/>
							</td>
						</tr>
						<tr>
							<th>Start Semester</th>
							<td>
								<select onChange={this.handleSemesterChange} value={this.state.semester} style={{width: '150px', boxSizing: 'border-box'}}>{this.renderSemesterOptions()}</select>
							</td>
						</tr>
						<tr>
							<th>Start Year</th>
							<td>
								<select onChange={this.handleYearChange} value={this.state.year} style={{width: '150px', boxSizing: 'border-box'}}>{this.renderYearOptions()}</select>
							</td>
						</tr>
					</tbody>
				</table>
				{this.renderSubmit()}
			</div>
		);
	}
}
