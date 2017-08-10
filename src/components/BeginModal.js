import React from 'react';
import '../styles/BeginModal.css';


const BeginModal = ({secret, category, isFake}) => {

  const modalContent = (
    <div className="modal-content modal-begin">
      <div className="modal-header">Get Ready to Doodle!</div>
      <div className={`modal-image ${isFake ? 'fake' : ''}`}></div>
      <div className="modal-category"><span>Category:</span> {category}</div>
      <div className="modal-secret"><span>Secret:</span> {secret}</div>
    </div>
  )

  return modalContent;
}

export default BeginModal;