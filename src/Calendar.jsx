import React, { Component } from 'react';
import firebase from 'firebase';
import DateSelector from './DateSelector';
import { Base64 } from 'js-base64';
import 'firebase/firestore';

let daysInWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default class Calendar extends Component {
	
	constructor(props) {
		super(props);
		
		let current = new Date();
		this.state = {
			month: current.getMonth(),
			year: current.getFullYear(),
			databaseHours: {},
			submitted: {},
			updates: {},
			uid: props.uid,
			supervisor: ''
		};
		
		// Get a reference to the database service
		this.db = firebase.firestore();
		const settings = {timestampsInSnapshots: true};
		this.db.settings(settings);
	}
	
	componentWillReceiveProps(nextProps) {
		this.setState((prevState) => {
			return {
				editable: nextProps.editable,
				uid: nextProps.uid
			};
		}, () => {
			this.stopHoursListener();
			this.startHoursListener();
		});
	}
	
	startHoursListener = () => {
		let year = this.state.year.toString();
		let month = this.state.month.toString();
		this.unsubscribeApproved = this.db.collection('users').doc(this.state.uid)
			.collection('year').doc(year)
			.collection('month').doc(month).onSnapshot((doc) => {
			this.setState((prevState) => {
				let update = {
					databaseHours: prevState.databaseHours
				};
				if (!update.databaseHours[year]) update.databaseHours[year] = {};
				update.databaseHours[year][month] = doc.data();
				
				return update;
			});
		});
		this.unsubscribeSubmitted = this.db.collection('users').doc(this.state.uid)
			.collection('submitted').onSnapshot((snapshot) => {
			var submitted = {};
			snapshot.docs.forEach((doc) => {
				submitted[doc.id] = doc.data();
			});
			this.setState({
				submitted: submitted
			});
		});
		this.db.collection('users').doc(this.state.uid).get().then((doc) => {
			if (doc.data() !== null) {
				this.setState({
					supervisor: doc.data().supervisor
				});
			}
		});
	}
	
	stopHoursListener = () => {
		this.unsubscribeApproved();
		this.unsubscribeSubmitted();
	};
	
	componentDidMount() {
		this.startHoursListener();
	}
	
	getHoursFromLocation = (hoursLocation, year, month, date) => {
		var ref = hoursLocation;
		if (!ref) return null;
		ref = ref[year.toString()];
		if (!ref) return null;
		ref = ref[month.toString()];
		if (!ref) return null;
		ref = ref[date.toString()];
		if (!ref) return null;
		return ref;
	};
	
	getHours = (year, month, date) => {
		var databaseHours = this.getHoursFromLocation(this.state.databaseHours, year, month, date);
		if (!databaseHours) databaseHours = 0;
		
		var submittedHours = databaseHours;
		if (this.state.submitted[year + '-' + month + '-' + date] !== undefined) {
			submittedHours = this.state.submitted[year + '-' + month + '-' + date].hours;
		}
		
		var pendingHours = submittedHours;
		if (this.state.updates[year + '-' + month + '-' + date] !== undefined) {
			pendingHours = this.state.updates[year + '-' + month + '-' + date].hours;
		}
		
		return {
			databaseHours: databaseHours,
			submittedHours: submittedHours,
			pendingHours: pendingHours
		};
	};
	
	getHoursDisplay = (year, month, date) => {
		let hours = this.getHours(year, month, date);
		if (hours.pendingHours !== hours.submittedHours) {
			return {
				status: 'pending',
				hours: hours.pendingHours
			};
		} else if (hours.submittedHours !== hours.databaseHours) {
			return {
				status: 'submitted',
				hours: hours.submittedHours
			};
		} else {
			return {
				status: 'approved',
				hours: hours.databaseHours
			};
		}
	};
	
	renderCalendar = () => {
		let tempDate = new Date(this.state.year, this.state.month + 1, 0);
		let totalDays = tempDate.getDate();
		let gapAfter = 6 - tempDate.getDay();
		tempDate.setDate(1);
		let gapBefore = tempDate.getDay();
		let weeks = (gapBefore + totalDays + gapAfter) / 7;
		
		var weekRenders = [];
		for (var week = 0; week < weeks; week++) {
			weekRenders.push(this.renderWeek(week, gapBefore, totalDays, gapAfter));
		}
		
		var headers = [];
		for (var day = 0; day < 7; day++) {
			headers.push(<th style={{border: '2px solid #000'}}>{daysInWeek[day]}</th>);
		}
		return (
			<table style={{width: '100%', borderCollapse: 'collapse'}}>
				<colgroup>
					<col span="1" style={{width: '14%'}} />
					<col span="1" style={{width: '14%'}} />
					<col span="1" style={{width: '14%'}} />
					<col span="1" style={{width: '14%'}} />
					<col span="1" style={{width: '14%'}} />
					<col span="1" style={{width: '14%'}} />
					<col span="1" style={{width: '14%'}} />
				</colgroup>
				<tbody>
				<tr>{headers}</tr>
				{weekRenders}
				</tbody>
			</table>
		);
	}
	
	onDateChanged = (year, month) => {
		this.setState((prevState) => {
			return {
				year: year,
				month: month
			};
		}, () => {
			this.stopHoursListener();
			this.startHoursListener();
		});
	};
	
	renderWeek = (week, gapBefore, totalDays, gapAfter) => {
		var weekdays = [];
		
		for (var square = (week * 7); square < (week * 7) + 7; square++) {
			weekdays.push(this.renderDate(square, gapBefore, totalDays, gapAfter));
		}
		
		return <tr>{weekdays}</tr>;
	};
	
	renderDate = (square, gapBefore, totalDays, gapAfter) => {
		let date = square - gapBefore;
		
		var hourList = [];
		for (var hour = 0; hour <= 10; hour++) {
			hourList.push(<option value={hour}>{hour}</option>);
		}
		
		if (date >= 0 && date < totalDays) {
			let hoursDisplay = this.getHoursDisplay(this.state.year, this.state.month, date);
			var color = '#fff';
			if (hoursDisplay.status === 'pending') {
				color = '#ff0';
			} else if (hoursDisplay.status === 'submitted') {
				color = '#0f0';
			}
			
			if (this.props.editable) {
				return (
					<td style={{border: '2px solid #999', backgroundColor: color}}>
						<table style={{width: '100%', borderCollapse: 'collapse'}}>
							<tbody>
							<tr><td>
								<p style={{margin: '0'}}>{date + 1}</p>
							</td></tr>
							<tr><td>
								<p style={{fontSize: '75%', margin: '0'}}>Enter hours:</p>
							</td></tr>
							<tr><td>
								<select onChange={this.handleDateChange(this.state.year, this.state.month, date)} value={hoursDisplay.hours} style={{width: '100%'}}>{hourList}</select>
							</td></tr>
							</tbody>
						</table>
					</td>
				);
			} else {
				return (
					<td style={{border: '2px solid #999', backgroundColor: color}}>
						<table style={{width: '100%', borderCollapse: 'collapse'}}>
							<tbody>
							<tr><td>
								<p style={{margin: '0'}}>{date + 1}</p>
							</td></tr>
							<tr><td>
								<p style={{fontSize: '75%', margin: '0'}}>Hours:</p>
							</td></tr>
							<tr><td>
								<p style={{margin: '0'}}>{hoursDisplay.hours}</p>
							</td></tr>
							</tbody>
						</table>
					</td>
				);
			}
		} else {
			return <td style={{border: '2px solid #ccc'}}></td>
		}
	};
	
	handleDateChange = (year, month, date) => {
		return (event) => {
			let value = parseInt(event.target.value);
			this.setState((prevState, props) => {
				var updates = prevState.updates;
				
				// update differences
				updates[year + '-' + month + '-' + date] = {
					year: year,
					month: month,
					date: date,
					hours: value
				};
				
				return {
					updates: updates
				};
			});
		};
	};
	
	renderSubmit = () => {
		if (this.props.editable) {
			let updateRows = this.renderUpdates();
			if (updateRows.length > 0) {
				return (
					<div>
						<p>The following updates have not been submitted:</p>
						<table style={{width: '100%'}}>
							<colgroup>
								<col span="1" style={{width: '50%'}} />
								<col span="1" style={{width: '50%'}} />
							</colgroup>
							<tbody>
								<tr>
									<th>Date</th>
									<th>Updated Hours</th>
								</tr>
								{updateRows}
							</tbody>
						</table>

						<p>Submit your updates below. An email will be sent to the admins notifying them that you have updated your hours!</p>
						<div style={{'textAlign': 'center'}}>
							<button style={{width: '150px', height: '30px', float: 'center'}} onClick={this.handleSubmit}>Submit</button>
						</div>
					</div>
				);
			}
		}
	};
	
	renderUpdates = () => {
		var updateList = [];
		Object.keys(this.state.updates).map((k, i) => k).sort().forEach((k) => {
			let update = this.state.updates[k];
			let hours = this.getHours(update.year, update.month, update.date);
			if (update.hours !== hours.submittedHours) {
				updateList.push(
					<tr>
						<td style={{textAlign: 'center'}}>
							{update.month + 1}/{update.date + 1}/{update.year}
						</td>
						<td style={{textAlign: 'center'}}>
							{update.hours}
						</td>
					</tr>
				);
			}
		});
		return updateList;
	};
	
	handleSubmit = () => {
		// Get a new write batch
		var batch = this.db.batch();
		var emailUpdates = '';
		
		Object.keys(this.state.updates).map((k, i) => k).sort().forEach((k) => {
			let update = this.state.updates[k];
			let hours = this.getHours(update.year, update.month, update.date);
			if (update.hours !== hours.submittedHours) {
				var dbRef = this.db.collection('users').doc(this.state.uid)
					.collection('submitted').doc(update.year + '-' + update.month + '-' + update.date);
				var hoursUpdate = {
					year: update.year,
					month: update.month,
					date: update.date,
					hours: update.hours
				};
				batch.set(dbRef, hoursUpdate);
				emailUpdates += update.month + '/' + update.date + '/' + update.year + ': ' + update.hours + '\n';
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
		});
	};
	
	handleSend = (emailUpdates) => {
		this.sendMessage(
			{
				'To': this.state.supervisor,
				'Subject': 'Hours Updates'
			},
			'Hello Supervisor,\n\n' +
			'The following updates have been made to my hours:\n' +
			emailUpdates +
			'Please review them using the link below:\n' +
			this.linkPath()
		);
	};
	
	linkPath = () => {
		return window.location.origin + '/review' +
			'/' + encodeURI(this.state.uid);
	}
	
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
	
	render() {
		return (
			<div>
				<p>Select calendar year and month:</p>
				<DateSelector onDateChanged={this.onDateChanged} />
				<p>Hours calendar:</p>
				{this.renderCalendar()}
				{this.renderSubmit()}
			</div>
		);
	}
}