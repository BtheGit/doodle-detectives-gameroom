import React from 'react';

const StatusPanel = (props) => {
	const playerStyle = {
		color: props.currentColor
	}
  return (
    <div className="turndisplay-container">
      <div className="turndisplay-secret">
        <div>CATEGORY: <span>{props.secret.category}</span></div>
        <div>SECRET: <span>{props.secret.secret}</span></div>
      </div>
    </div>    
  );
};

export default StatusPanel;

