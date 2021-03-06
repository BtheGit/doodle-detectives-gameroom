import React from 'react';
import StatusPanel from './StatusPanel.js';
import FakeGuessForm from './FakeGuessForm.js';

//Game State Toggles
const DISPLAYSECRET = 'DISPLAYSECRET',
      DRAWING       = 'DRAWING',
      FAKEVOTE      = 'FAKEVOTE',
      GUESSVOTE     = 'GUESSVOTE',
      GUESSAPPROVAL = 'GUESSAPPROVAL',
      GAMEOVER      = 'GAMEOVER';

//Session State Toggles
const GAMEACTIVE        = 'GAMEACTIVE',
      WAITINGTOSTART    = 'WAITINGTOSTART',
      WAITINGFORPLAYERS = 'WAITINGFORPLAYERS';

const StatusDisplay = props => {

	function renderStatusMessage(message) {
    return <div className="statusdisplay-message">{message}</div>
  }

  function renderVoteToBegin() {
    return(
      <div className='statusdisplay-votetobegin'>
        <button onClick={props.emitVoteToBegin}>BEGIN!</button>
        <div>Vote 'Begin' to get this party started!</div>
        <div>Game will commence when all players vote.</div>
      </div>
    )
  }

  function renderVoteForFake() {
    if (props.fakeVote.hasVoted) {
      return renderStatusMessage('Waiting for other players to vote...')
    }
  }

  function renderFormForFakeGuess() {
    return(
      <div className="statusdisplay-fakeguess">
        <h2>You were Found!</h2>
        <p>You have one chance to steal the win if you can guess the secret clue correctly</p>
        <FakeGuessForm 
          submitFakeGuess={props.emitGuess}
        />
      </div>
    )
  }

  function selectStatusDisplay() {
    const currentState = props.currentState;
    if (currentState === GAMEACTIVE) {
      const phase = props.currentPhase;
      if (phase === DRAWING || phase === DISPLAYSECRET) {
        return (
          <StatusPanel 
            currentPlayer = { props.currentPlayer }
            secret = { props.secret }
            fakeIsMe = { props.fakeIsMe }
          />
        );       
      }
      else if (phase === FAKEVOTE) {
        return renderVoteForFake();
      }
      else if (phase === GUESSVOTE) {
        if(props.fakeIsMe) {
          if(!props.hasGuessed) {
            //Show Form component to receive guess
            return renderFormForFakeGuess();
          }
          else {
            return renderStatusMessage('Guess submitted. Waiting for approval...');
          }
        }
        else {
          return renderStatusMessage('Waiting for fake to guess...');
        }
      }
      else if (phase === GUESSAPPROVAL) {
        if(!props.fakeIsMe) {
          if(!props.guessApproval.hasVoted) {
            return null;
          }
          else {
            return renderStatusMessage('Vote sent. Waiting for others to vote...')
          }
        }
        else {
          //I am the fake. Don't let me vote to approve my own guess!
          return renderStatusMessage('Guess submitted. Waiting for approval...');
        }
      }
      else if (phase === GAMEOVER) {
        //render vote to start new game ()
        return renderStatusMessage('Game Over')
      }
    }
    //GAME NOT ACTIVE PHASES
    else { 
      if (currentState === WAITINGFORPLAYERS) {
        return renderStatusMessage('Waiting for Players...');
      } 
      else if (currentState === WAITINGTOSTART) {
        return !props.hasVotedToBegin ? renderVoteToBegin() 
                                     : renderStatusMessage('Waiting for other players to vote...');
      }
      else {
        return renderStatusMessage('Waiting for Server...');
      }
    }
  }

  return (
    <div className='statusdisplay-container'>
      {selectStatusDisplay()}
    </div>
  );
};

export default StatusDisplay;
