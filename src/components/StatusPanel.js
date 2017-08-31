import React from 'react';

const StatusPanel = (props) => {
  return (
    <div className="turndisplay-container">
      <div className="turndisplay-secret">
        <div>CATEGORY: <span>{props.secret.category}</span></div>
        {props.fakeIsMe ? null : <div>SECRET: <span>{props.secret.secret}</span></div>}
      </div>
    </div>    
  );
};

export default StatusPanel;

