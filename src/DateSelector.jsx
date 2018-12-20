import React, { Component } from 'react';

let monthsInYear = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default class DateSelector extends Component {
	
	constructor(props) {
		super(props);
		
		let current = new Date();
		this.state = {
			year: current.getFullYear(),
			month: current.getMonth(),
			date: current.getDate() - 1,
			showDate: props.showDate
		};
		
		this.onDateChanged = props.onDateChanged;
	}
	
	renderYearOptions = () => {
		let current = new Date();
		current.setMonth(current.getMonth() - 6);
		let yearLower = current.getFullYear();
		current.setMonth(current.getMonth() + 12);
		let yearUpper = current.getFullYear();
		var yearList = [];
		for (var year = yearLower; year <= yearUpper; year++) {
			yearList.push(<option value={year}>{year}</option>);
		}
		return yearList;
	};
	
	renderMonthOptions = () => {
		var monthList = [];
		for (var month = 0; month < 12; month++) {
			monthList.push(<option value={month}>{monthsInYear[month]}</option>);
		}
		return monthList;
	};
	
	renderDateOptions = () => {
		let dateObj = new Date(this.state.year, this.state.month + 1, 0);
		var dateList = [];
		for (var date = 0; date < dateObj.getDate(); date++) {
			dateList.push(<option value={date}>{date + 1}</option>);
		}
		return dateList;
	};
	
	handleChange = () => {
		if (this.state.showDate) {
			this.onDateChanged(this.state.year, this.state.month, this.state.date);
		} else {
			this.onDateChanged(this.state.year, this.state.month);
		}
	};
	
	handleYearChange = (event) => {
		let updater = (value) => (prevState) => ({
			year: parseInt(value)
		});
		this.setState(updater(event.target.value), this.handleChange);
	};
	
	handleMonthChange = (event) => {
		let updater = (value) => (prevState) => {
			let dateObj = new Date(prevState.year, parseInt(value) + 1, 0);
			return ({
				month: parseInt(value),
				date: (prevState.date < dateObj.getDate() ? prevState.date : dateObj.getDate() - 1)
			});
		};
		this.setState(updater(event.target.value), this.handleChange);
	};
	
	handleDateChange = (event) => {
		let updater = (value) => (prevState) => ({
			date: parseInt(value)
		});
		this.setState(updater(event.target.value), this.handleChange);
	};
	
	renderDate = () => {
		if (this.state.showDate) {
			return (
				<tr>
					<th>Date</th>
					<td>
						<select onChange={this.handleDateChange} value={this.state.date} style={{width: '150px'}}>{this.renderDateOptions()}</select>
					</td>
				</tr>
			);
		} else {
			return <></>
		}
	};
	
	render() {
		return (
			<div>
				<table style={{width: '100%'}}>
					<colgroup>
						<col span="1" style={{width: '30%'}} />
						<col span="1" style={{width: '70%'}} />
					</colgroup>
					<tbody>
						<tr>
							<th>Year</th>
							<td>
								<select onChange={this.handleYearChange} value={this.state.year} style={{width: '150px'}}>{this.renderYearOptions()}</select>
							</td>
						</tr>
						<tr>
							<th>Month</th>
							<td>
								<select onChange={this.handleMonthChange} value={this.state.month} style={{width: '150px'}}>{this.renderMonthOptions()}</select>
							</td>
						</tr>
						{this.renderDate()}
					</tbody>
				</table>
			</div>
		);
	}
}