import React, { Component } from 'react';

class FakeGuessForm extends Component {
	constructor(props) {
		super(props);
		this.state = {
			inputText: ''
		}
	}

	onChange = event => {
		this.setState({inputText: event.target.value})
	}

	onSubmit = event => {
		event.preventDefault();
		this.props.submitFakeGuess(this.state.inputText)
	}

	render() {
		return(
			<form onSubmit={this.onSubmit}>
        <input 
          type="text" 
          value={this.state.inputText}
          onChange={this.onChange}
        />
      </form>
		)
	}
}

export default FakeGuessForm;