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
			sort: {
				nameAscending: false,
				nameDescending: false,
				startAscending: false,
				startDescending: false
			},
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
	
	dateDiff = (startDate, endDate) => {
		return Math.round((endDate - startDate)/(1000*60*60*24)) + 1;
	};
	
	handleCreate = (startYear, startMonth, startDate, endYear, endMonth, endDate) => () => {
		let startDateObj = new Date(startYear, startMonth, startDate + 1);
		let endDateObj = new Date(endYear, endMonth, endDate + 1);
		let range = this.dateDiff(startDateObj, endDateObj);
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
				let users = snapshot.docs.map((doc) => ({uid: doc.id, ...doc.data()})).sort(this.compareUsers);
				users.forEach((doc, index) => {
					let dateObj = new Date(startYear, startMonth, startDate + 1);
					while (dateObj <= endDateObj) {
						monthRefs.push(this.db.collection('users').doc(doc.uid)
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
							endDate: monthEndDate,
							userIndex: index
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
				values.push('Supervisor');
				values.push('Start Semester');
				values.push('Start Year');
				let headers = values.length;
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
				
				// add header rows
				range = 'Sheet1!B1';
				values = [];
				users.forEach((user) => {
					values.push([user.name, user.email, user.supervisor, user.start.semester, user.start.year]);
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
				let lastRow = this.dateDiff(startDateObj, endDateObj) + headers;
				range = 'Sheet1!B' + (lastRow + 1);
				values = [];
				users.forEach((doc,i) => {
					let letteredNum = toLetteredNum(i + 2);
					values.push('=SUM(' + letteredNum + (headers + 1) + ':' + letteredNum + lastRow + ')');
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
						var range = 'Sheet1!' + toLetteredNum(monthInfo[i].userIndex + 2) + (this.dateDiff(startDateObj, monthStartDate) + headers);
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
				
			});
			
		});
	};
	
	handleNameAscending = (event) => {
		let checked = event.target.checked;
		this.setState((prevState) => {
			var update = {sort: prevState.sort};
			update.sort.nameAscending = checked;
			if (checked) {
				update.sort.nameDescending = false;
				update.sort.startAscending = false;
				update.sort.startDescending = false;
			}
			
			return update;
		});
	};
	
	handleNameDescending = (event) => {
		let checked = event.target.checked;
		this.setState((prevState) => {
			var update = {sort: prevState.sort};
			update.sort.nameDescending = checked;
			if (checked) {
				update.sort.nameAscending = false;
				update.sort.startAscending = false;
				update.sort.startDescending = false;
			}
			
			return update;
		});
	};
	
	handleStartAscending = (event) => {
		let checked = event.target.checked;
		this.setState((prevState) => {
			var update = {sort: prevState.sort};
			update.sort.startAscending = checked;
			if (checked) {
				update.sort.nameAscending = false;
				update.sort.nameDescending = false;
				update.sort.startDescending = false;
			}
			
			return update;
		});
	};
	
	handleStartDescending = (event) => {
		let checked = event.target.checked;
		this.setState((prevState) => {
			var update = {sort: prevState.sort};
			update.sort.startDescending = checked;
			if (checked) {
				update.sort.nameAscending = false;
				update.sort.nameDescending = false;
				update.sort.startAscending = false;
			}
			
			return update;
		});
	};
	
	compareUsers = (a, b) => {
		var compareName = a.name.split(' ').pop(0).localeCompare(b.name.split(' ').pop(0));
		if (this.state.sort.nameDescending) compareName *= -1;
		
		var compareStart = a.start.year - b.start.year;
		if (compareStart === 0) compareStart = b.start.semester.split(' ').pop(0).localeCompare(a.start.semester.split(' ').pop(0))
		if (this.state.sort.startDescending) compareStart *= -1;
		
		var result = 0;
		if (this.state.sort.nameAscending || this.state.sort.nameDescending) {
			result = compareName;
			if (result === 0) result = compareStart;
		}
		if (this.state.sort.startAscending || this.state.sort.startDescending) {
			result = compareStart;
			if (result === 0) result = compareName;
		}
		return result;
	};
	
	setRange = () => {
		let startDate = new Date(this.state.startYear, this.state.startMonth, this.state.startDate + 1);
		let endDate = new Date(this.state.endYear, this.state.endMonth, this.state.endDate + 1);
		let range = this.dateDiff(startDate, endDate);
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
						<col span="1" style={{width: '30%'}} />
						<col span="1" style={{width: '30%'}} />
						<col span="1" style={{width: '20%'}} />
						<col span="1" style={{width: '20%'}} />
					</colgroup>
					<tbody>
						<tr>
							<th>
								<div style={{textAlign: 'left'}}>
									User
								</div>
							</th>
							<th>
								<div style={{textAlign: 'left'}}>
									Start Date
								</div>
							</th>
							<th>Details</th>
							<th>Delete</th>
						</tr>
						<tr>
							<td style={{borderBottom: '1px solid #ddd', borderTop: '1px solid #ddd'}}>
								<table style={{width: '100%'}}>
									<tbody>
										<tr>
											<td colSpan='2'>Sort by name:</td>
										</tr>
										<tr>
											<td>
												<input type='checkbox' style={{width: '20px', height: '20px'}} onChange={this.handleNameAscending} checked={this.state.sort.nameAscending} />
											</td>
											<td>Ascending</td>
										</tr>
										<tr>
											<td>
												<input type='checkbox' style={{width: '20px', height: '20px'}} onChange={this.handleNameDescending} checked={this.state.sort.nameDescending} />
											</td>
											<td>Descending</td>
										</tr>
									</tbody>
								</table>
							</td>
							<td style={{borderBottom: '1px solid #ddd', borderTop: '1px solid #ddd'}}>
								<table style={{width: '100%'}}>
									<tbody>
										<tr>
											<td colSpan='2'>Sort by start:</td>
										</tr>
										<tr>
											<td>
												<input type='checkbox' style={{width: '20px', height: '20px'}} onChange={this.handleStartAscending} checked={this.state.sort.startAscending} />
											</td>
											<td>Ascending</td></tr>
										<tr>
											<td>
												<input type='checkbox' style={{width: '20px', height: '20px'}} onChange={this.handleStartDescending} checked={this.state.sort.startDescending} />
											</td>
											<td>Descending</td>
										</tr>
									</tbody>
								</table>
							</td>
							<td style={{borderBottom: '1px solid #ddd', borderTop: '1px solid #ddd'}}></td>
							<td style={{borderBottom: '1px solid #ddd', borderTop: '1px solid #ddd'}}></td>
						</tr>
						{this.state.users.sort(this.compareUsers).map((u, i) =>
						<>
							<tr>
								<td>
									<div style={{textAlign: 'left'}}>
										<p style={{fontSize: '150%', margin: '0'}}>{u.name}</p>
										<p style={{margin: '0'}}>{u.email}</p>
									</div>
								</td>
								<td>
									<div>
										<p style={{fontSize: '150%', margin: '0'}}>{u.start.year}</p>
										<p style={{margin: '0'}}>{u.start.semester}</p>
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
								<td colSpan='4'>
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
