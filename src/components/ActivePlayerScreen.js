import React from 'react';

const ActivePlayerScreen = ({players, playerColors}) => {
  return (
    <div id="activeplayer-container">
      {players.map((player, idx) => {
      	const divStyle = {
      		color: playerColors[player.id] || 'black'
      	}
        return <div key={idx} style={divStyle}>{player.name}</div>
      })}
    </div>    
  );
};

export default ActivePlayerScreen;
