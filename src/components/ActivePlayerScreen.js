import React from 'react';

const ActivePlayerScreen = ({players}) => {
  return (
    <div id="activeplayer-container">
      {players.map((player, idx) => {
        return <div key={idx}>{player.name}</div>
      })}
    </div>    
  );
};

export default ActivePlayerScreen;
