import React from 'react';

const GuessApprovalForm = props => {

	const clickHandler = event => {
		event.preventDefault();
		props.submitGuessApproval(event.target.dataset.txt)
	}

	return(
		<div>
			<h3>Did the fake artist guess the secret correctly?</h3>
			<h4>Secret: {props.secret}</h4>
			<h4>Fake Artist's Guess: {props.guess}</h4>
			<button data-txt="yes" onClick={clickHandler}>Yes</button>
			<button data-txt="no" onClick={clickHandler}>No</button>
		</div>
	)

}

export default GuessApprovalForm;