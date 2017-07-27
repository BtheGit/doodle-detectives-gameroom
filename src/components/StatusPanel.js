import React from 'react';

const StatusPanel = (props) => {
	const playerStyle = {
		color: props.currentColor
	}
  return (
    <div id="turndisplay-container">
      <div id="turndisplay-currentcolor">Drawing: <span style={playerStyle}>{props.currentPlayer}</span></div>
      <div id="turndisplay-category">Category: {props.secret.category}</div>
      <div id="turndisplay-secret">Secret: {props.secret.secret}</div>
    </div>    
  );
};

export default StatusPanel;

