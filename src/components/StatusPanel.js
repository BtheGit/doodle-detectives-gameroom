import React from 'react';

const StatusPanel = (props) => {
	const playerStyle = {
		color: props.currentColor
	}
  return (
    <div className="turndisplay-container">
      <div className="turndisplay-currentplayer">Drawing: <span style={playerStyle}>{props.currentPlayer}</span></div>
      <div className="turndisplay-secret">
        <div>{props.secret.category}</div>
        <div>{props.secret.secret}</div>
      </div>
    </div>    
  );
};

export default StatusPanel;

