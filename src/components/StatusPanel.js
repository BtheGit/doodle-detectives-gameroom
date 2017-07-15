import React from 'react';

const StatusPanel = (props) => {
  return (
    <div id="statusPanel">
      <div id="statuspanel-gamestate">Game: TODO</div>
      <div id="statuspanel-turncolor">Active Player: {props.turnColor}</div>
      <div id="statuspanel-category">Category: {props.secret.category}</div>
      <div id="statuspanel-secret">Secret: {props.secret.secret}</div>
    </div>    
  );
};

export default StatusPanel;

      // <div id="statuspanel-turncount">Turn: TODO</div>
