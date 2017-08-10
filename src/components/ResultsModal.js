import React from 'react';
import '../styles/ResultsModal.css';


const ResultsModal = ({fakeWins, fakeFound, players}) => {
  function results(fakeWins, fakeFound) {
    if(fakeWins) {
      if(fakeFound) {
        return {
          header: 'Fake Wins!',
          text: 'was uncovered but guessed the secret correctly to steal the win.',
          class: 'fake-wins-found'
        }
      }
      else {
        return {
          header: 'Fake Wins!',
          text: 'was never identified. A sound defeat for the art of deduction.',
          class: 'fake-wins-notfound'
        }
      }
    }
    else {
      return {
        header: 'Detectives Win!',
        text: 'was found and failed to discover the secret. A great victory for the forces of deduction!',
        class: 'detectives-win'
      }
    }
  }

  function fakeReveal(players) {
    players = players.filter(player => player.isFake);
    const fake = players[0];
    const divStyle = {
        color: fake.color,
    };
    return fake;
  }

  const res = results(fakeWins, fakeFound)
  const fake = fakeReveal(players)
  const divStyle = {
      color: fake.color,
  };
  const modalContent = (
    <div className="modal-content modal-results">
      <div className={`top-half ${res.class}`}>
        <div className="modal-header">{res.header}</div>
      </div>
      <div className="bottom-half">
        <div className="modal-results-text"><span style={divStyle}>{`${fake.name} `}</span>{`${res.text}`}</div>
      </div>
      <div className={`center-image ${fakeWins?'mood-sad':'mood-happy'}`}></div>
    </div>
  )

  return modalContent;  
} 

export default ResultsModal;