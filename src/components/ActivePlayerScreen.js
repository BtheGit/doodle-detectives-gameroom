import React from 'react';

const ActivePlayerScreen = ({players, playerColors}) => {
  return (
    <div className="activeplayer-container">
      <div className="activeplayer-header">Players</div>
      {players.map((player, idx) => {
      	const divStyle = {
      		color: playerColors[player.id] || 'white'
      	}
        return <div key={idx} style={divStyle} className="activeplayer-player">{player.name}</div>
      })}
    </div>    
  );
};

export default ActivePlayerScreen;
