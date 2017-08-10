import React from 'react';
import '../styles/GuessApprovalModal.css';

const GuessApprovalForm = props => {

	const clickHandler = event => {
		event.preventDefault();
		props.submitGuessApproval(event.target.dataset.txt)
	}

	return(
		<div className="guessapprovalform">
			<h3>Did the fake artist guess the secret correctly?</h3>
			<div className="approval-guess-container">
				<h4>Secret: <span>{props.secret}</span></h4>
				<h4>Guess: <span>{props.guess}</span></h4>
				<button className="approval-button" data-txt="yes" onClick={clickHandler}>✓</button>
				<button className="approval-button" data-txt="no" onClick={clickHandler}>✗</button>
			</div>
		</div>
	)

}

export default GuessApprovalForm;