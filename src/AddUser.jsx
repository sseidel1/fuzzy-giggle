import React, { Component } from 'react';

export default class AddUser extends Component {
	
	constructor(props) {
		super(props);
		this.message = props.message;
		this.user = props.user;
		this.userSubmitted = props.userSubmitted;
		
		this.state = {
		};
	}
	
	handleNameChange(event) {
		this.setState({
			name: event.target.value,
			validName: true
		});
	}
	
	handleEmailChange(event) {
		this.setState({
			email: event.target.value,
			validEmail: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(event.target.value)
		});
	}
	
	handleSubmit(event) {
		event.preventDefault();
		
		if (this.state.validName && this.state.validEmail) {
			this.userSubmitted({ name: this.state.name, email: this.state.email });
		}
	}
	
	render() {
		return (
			<div>
				<h3>{this.message}</h3>
				<form onSubmit={this.handleSubmit.bind(this)}>
					<label>
						Name: <input type="text" value={this.state.name} onChange={this.handleNameChange.bind(this)} />
					</label>
					<label>
						Email: <input type="text" value={this.state.email} onChange={this.handleEmailChange.bind(this)} />
					</label>
					<input type="submit" value="Submit" />
				</form>
			</div>
		);
	}
}