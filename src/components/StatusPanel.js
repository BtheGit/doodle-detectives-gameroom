import React from 'react';

const StatusPanel = (props) => {
  return (
    <div id="statusPanel">
      <div id="statuspanel-gamestate">Game: TODO</div>
      <div id="statuspanel-currentcolor">Active Player: {props.currentColor}</div>
      <div id="statuspanel-category">Category: {props.secret.category}</div>
      <div id="statuspanel-secret">Secret: {props.secret.secret}</div>
    </div>    
  );
};

export default StatusPanel;

