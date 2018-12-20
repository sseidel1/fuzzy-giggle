import React, { Component } from 'react';
import Calendar from './Calendar';

export default class UserDash extends Component {
	
	constructor(props) {
		super(props);
		
		let current = new Date();
		this.state = {
			month: current.getMonth(),
			year: current.getFullYear(),
			uid: props.uid
		};
		
	}
	
	componentWillReceiveProps(nextProps) {
		this.setState({
			uid: nextProps.uid
		});
	}
	
	render() {
		
		return (
			<div>
				<div style={{'textAlign': 'center'}}>
					<h3>User Dashboard</h3>
				</div>
				<p>Enter your hours below (be sure to click Submit after making changes!):</p>
				<Calendar uid={this.state.uid} key={this.state.uid} editable={true} />
			</div>
		);
	}
}