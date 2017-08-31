import React from 'react';
import '../styles/BeginModal.css';

const fakeObj = (
  <div className="modal-objective">
    <p>Your goal is to blend in at all costs and avoid being discovered.</p>
    <p>As long as less than half the players don't vote for you at the end you won't be caught.</p>
    <p>If they catch you, you still have a chance to impersonate a Detective and win by guessing the secret correctly!</p>
  </div>
)
const detObj = (
  <div className="modal-objective">
    <p>Your goal is to locate the one player who doesn't know the secret.</p>
    <p>Remember, you need to demonstrate to your fellow detectives that you aren't the fake through your drawing.</p>
    <p>Careful, if you're too obvious the fake will be able to guess the secret and escape detection!</p>
  </div>
)

const BeginModal = ({secret, category, isFake}) => {

  const modalContent = (
    <div className="modal-content modal-begin">
      <div className="modal-image-container">
        <div className={`modal-image ${isFake ? 'fake' : ''}`}></div>
      </div>
      <div className="modal-role">{isFake ? 'Fake' : 'Detective'}</div>
      <div className="modal-category"><span>Category:</span> {category}</div>
      {isFake ? null : <div className="modal-secret"><span>Secret:</span> {secret}</div>}
      {isFake ? fakeObj : detObj}
    </div>
  )

  return modalContent;
}

export default BeginModal;