import React, { Component } from 'react';
import {Redirect} from "react-router-dom";
import Calendar from './Calendar';
import DateSelector from './DateSelector';
import firebase from 'firebase';

class AdminDash extends Component {

	constructor(props) {
		super(props);
		
		let current = new Date();
		this.state = {
			redirectNewUser: false,
			users: [],
			startYear: current.getFullYear(),
			startMonth: current.getMonth(),
			startDate: current.getDate() - 1,
			endYear: current.getFullYear(),
			endMonth: current.getMonth(),
			endDate: current.getDate() - 1,
			range: 1
		};
		
		// Get a reference to the database service
		this.db = firebase.firestore();
		const settings = {timestampsInSnapshots: true};
		this.db.settings(settings);
		
		this.db.collection('users').onSnapshot((snapshot) => {
			this.setState({
				users: snapshot.docs.map((doc) =>
					({
						...doc.data(),
						uid: doc.id,
						calendarVisible: false
					}))
			});
		});
		
	}
	
	handleViewCalendarForUser = (i) => () => {
		this.setState((prevState) => {
			var updates = {
				...prevState
			};
			updates.users[i].calendarVisible = !prevState.users[i].calendarVisible;
			console.log(updates);
			return updates;
		});
	};
	
	handleDeleteUser = (i) => () => {
		if (window.confirm('Are you sure you want to delete ' + this.state.users[i].name + '?')) {
			this.db.collection('users').doc(this.state.users[i].uid).delete();
		}
	};
	
	handleStartDateChange = (year, month, date) => {
		this.setState((prevState) => ({
			startYear: year,
			startMonth: month,
			startDate: date
		}), this.setRange);
	};
	
	handleEndDateChange = (year, month, date) => {
		this.setState((prevState) => ({
			endYear: year,
			endMonth: month,
			endDate: date
		}), this.setRange);
	};
	
	handleCreate = (startYear, startMonth, startDate, endYear, endMonth, endDate) => () => {
		let startDateObj = new Date(startYear, startMonth, startDate + 1);
		let endDateObj = new Date(endYear, endMonth, endDate + 1);
		let range = (endDateObj - startDateObj)/(1000*60*60*24) + 1;
		if (range < 1) {
			return;
		}
		
		let current = new Date();
		var title = '';
		title += current.getFullYear() + '-';
		title += (current.getMonth() + 1) + '-';
		title += current.getDate() + '-';
		title += current.getHours() + '-';
		title += current.getMinutes() + '-';
		title += current.getSeconds() + '-';
		title += current.getMilliseconds();
		window.gapi.client.sheets.spreadsheets.create({
			properties: {
				title: title
			}
		}).then((response) => {
			let spreadsheetId = response.result.spreadsheetId;
			this.db.collection('users').onSnapshot((snapshot) => {
				this.setState({
					users: snapshot.docs.map((doc) =>
						({
							...doc.data(),
							uid: doc.id,
							calendarVisible: false
						}))
				});
			});
			
			this.db.collection('users').onSnapshot((snapshot) => {
				var monthRefs = [];
				var monthInfo = [];
				snapshot.docs.forEach((doc) => {
					let dateObj = new Date(startYear, startMonth, startDate + 1);
					while (dateObj <= endDateObj) {
						console.log('hours/' + doc.id + '/' + dateObj.getFullYear() + '/' + dateObj.getMonth() + '/');
						monthRefs.push(this.db.collection('users').doc(doc.id)
							.collection('year').doc(dateObj.getFullYear().toString())
							.collection('month').doc(dateObj.getMonth().toString()).get());
						
						dateObj.setDate(1);
						let monthStartDate = (dateObj < startDateObj ? startDateObj.getDate() : dateObj.getDate()) - 1;
						dateObj.setMonth(dateObj.getMonth() + 1)
						dateObj.setDate(0);
						let monthEndDate = (dateObj > endDateObj ? endDateObj.getDate() : dateObj.getDate()) - 1;
						
						monthInfo.push({
							year: dateObj.getFullYear(),
							month: dateObj.getMonth(),
							startDate: monthStartDate,
							endDate: monthEndDate
						});
						
						// set date to the 1st of the next month
						dateObj.setDate(1);
						dateObj.setMonth(dateObj.getMonth() + 1)
					}
				});
				
				var data = [];
				
				// add dates columns
				var range = 'Sheet1!A1';
				var values = [];
				values.push('Name');
				values.push('Email');
				for (let dateObj = new Date(startYear, startMonth, startDate + 1);
						dateObj <= endDateObj; dateObj.setDate(dateObj.getDate() + 1)) {
					values.push((dateObj.getMonth() + 1) +'/' + dateObj.getDate() + '/' + dateObj.getFullYear());
				}
				values.push('Total');
				data.push({
					range: range,
					majorDimension: 'COLUMNS',
					values: [values]
				});
				
				// add name and email rows
				range = 'Sheet1!B1';
				values = [];
				snapshot.docs.forEach((doc) => {
					values.push([doc.data().name, doc.data().email]);
				});
				data.push({
					range: range,
					majorDimension: 'COLUMNS',
					values: values
				});
				
				let toLetteredNum = (num) => {
					var letteredNum = '';
					while (num > 26) {
						letteredNum = String.fromCharCode(65 + (num % 26)) + letteredNum;
						num = num / 26;
					}
					letteredNum = String.fromCharCode(64 + num) + letteredNum;
					return letteredNum;
				};
				
				// add name and email rows
				let lastRow = (endDateObj - startDateObj)/(1000*60*60*24) + 3;
				range = 'Sheet1!B' + (lastRow + 1);
				values = [];
				snapshot.docs.forEach((doc,i) => {
					let letteredNum = toLetteredNum(i + 2);
					values.push('=SUM(' + letteredNum + '1:' + letteredNum + lastRow + ')');
				});
				data.push({
					range: range,
					majorDimension: 'ROWS',
					values: [values]
				});
				
				let getHoursFromLocation = (hoursLocation, date) => {
					var ref = hoursLocation;
					if (!ref) return 0;
					ref = ref[date.toString()];
					if (!ref) return 0;
					return ref;
				};
				
				Promise.all(monthRefs).then((snapshots) => {
					for (var i = 0; i < snapshots.length; i++) {
						let monthStartDate = new Date(monthInfo[i].year, monthInfo[i].month, monthInfo[i].startDate + 1);
						var range = 'Sheet1!' + toLetteredNum(i + 2) + ((monthStartDate - startDateObj)/(1000*60*60*24) + 3);
						var values = [];
						for (var dateIndex = monthInfo[i].startDate; dateIndex <= monthInfo[i].endDate; dateIndex++) {
							values.push(getHoursFromLocation(snapshots[i].data(), dateIndex));
						}
						data.push({
							range: range,
							majorDimension: 'COLUMNS',
							values: [values]
						});
						
					}
					
					let body = {
						data: data,
						valueInputOption: 'USER_ENTERED'
					};
					window.gapi.client.sheets.spreadsheets.values.batchUpdate({
						spreadsheetId: spreadsheetId,
						resource: body
					}).then((response) => {
						var result = response.result;
						window.open('https://docs.google.com/spreadsheets/d/' + response.result.spreadsheetId, '_blank');
						console.log(result);
					}).catch((error) => {
						console.log(error);
					});
					
				});
				
			}).catch((error) => {
				console.log(error);
			});
			
		});
	};
	
	setRange = () => {
		let startDate = new Date(this.state.startYear, this.state.startMonth, this.state.startDate + 1);
		let endDate = new Date(this.state.endYear, this.state.endMonth, this.state.endDate + 1);
		let range = (endDate - startDate)/(1000*60*60*24) + 1;
		this.setState({
			range: (range > 0 ? range : 0)
		});
	};
	
	renderCalendarForUser = (i) => {
		if (this.state.users[i].calendarVisible) {
			return <Calendar uid={this.state.users[i].uid} editable={false} />;
		} else {
			return <div></div>;
		}
	};
	
    render() {
		if (this.state.redirectNewUser) {
			return <Redirect to={{pathname: '/newuser'}} />
		}
		
        return (
            <div className="App">
				<div style={{'textAlign': 'center'}}>
					<h3>Admin Dashboard</h3>
					<p>Users</p>
				</div>
				<table style={{width: '100%'}}>
					<colgroup>
						<col span="1" style={{width: '50%'}} />
						<col span="1" style={{width: '25%'}} />
						<col span="1" style={{width: '25%'}} />
					</colgroup>
					<tbody>
						<tr>
							<th style={{borderBottom: '1px solid #ddd'}}>
								<div style={{textAlign: 'left'}}>
									User
								</div>
							</th>
							<th style={{borderBottom: '1px solid #ddd'}}>Details</th>
							<th style={{borderBottom: '1px solid #ddd'}}>Delete</th>
						</tr>
						{this.state.users.map((u, i) =>
						<>
							<tr>
								<td>
									<div style={{textAlign: 'left'}}>
										<p style={{fontSize: '150%', margin: '0'}}>{u.name}</p>
										<p style={{margin: '0'}}>{u.email}</p>
									</div>
								</td>
								<td>
									<button style={{width: '100%', height: '30px'}} onClick={this.handleViewCalendarForUser(i)}>
										{u.calendarVisible ? 'Hide Calendar' : 'View Calendar'}
									</button>
								</td>
								<td>
									<button style={{width: '100%', height: '30px', backgroundColor: '#FF0000'}}
										 onClick={this.handleDeleteUser(i)}>Delete User</button>
								</td>
							</tr>
							<tr>
								<td colSpan='3'>
									{this.renderCalendarForUser(i)}
								</td>
							</tr>
						</>)}
					</tbody>
				</table>
				
				<div style={{'textAlign': 'center'}}>
					<p>Accumulate Hours</p>
				</div>
				<p>Choose a start date below:</p>
				<DateSelector onDateChanged={this.handleStartDateChange} showDate={true} />
				<p>Choose an end date below:</p>
				<DateSelector onDateChanged={this.handleEndDateChange} showDate={true} />
				<p>You have selected a range of {this.state.range} day{(this.state.range === 1 ? '' : 's')}!</p>
				<div style={{'textAlign': 'center'}}>
					<button style={{width: '150px', height: '30px', float: 'center'}}
						onClick={this.handleCreate(
							this.state.startYear,
							this.state.startMonth,
							this.state.startDate,
							this.state.endYear,
							this.state.endMonth,
							this.state.endDate)}>Create Sheet
					</button>
				</div>
				
            </div>
    );
  }
}

export default AdminDash;
