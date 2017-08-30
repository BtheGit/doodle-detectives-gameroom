import React from 'react';
import '../styles/HelpModal.css';


const HelpModal = ({secret, category, isFake}) => {

  const modalContent = (
    <div className="modal-content modal-help">
      <h1>HOW TO PLAY</h1>
      <p>
        Every round, players are given a secret word that they are supposed 
        to draw a portion of during their turn. Except one player doesn't know the secret and is faking!
      </p>
      <p>At the end of the drawing phase, players will vote on which player they think was the fake.</p>
      <p>
        The object of the game for most players is to determine which player 
        is the fake based on their drawing. The fake just wants to remain undiscovered (receiving 
        less than half the votes).
      </p>
      <p>
        If the fake is discovered, he still has a chance to steal the win by correctly 
        guessing what the secret was.
      </p>
      <p>
        Remember, you want to draw just enough to let your fellow detectives 
        know that you aren't the fake, but not enough to make it easy for the fake to guess the secret!
      </p>
    </div>
  )

  return modalContent;
}

export default HelpModal;