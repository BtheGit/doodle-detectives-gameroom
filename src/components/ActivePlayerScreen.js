import React from 'react';
import '../styles/ActivePlayerScreen.css';

const ActivePlayerScreen = ({players, playerColors}) => {
  return (
    <div className="activeplayer-container">
      <div className="activeplayer-header">SUSPECTS</div>
      <div className="activeplayer-players">
        {players.map((player, idx) => {
          const cardStyle = {
            transform:`rotate(${Math.random() * (5 - -5) + -5}deg)`
          }
          const imageStyle = {
            color: playerColors[player.id] || 'white'
          }
        	const nameStyle = {
        		color: playerColors[player.id] || 'black'
        	}
          return (
            <div key={idx} className="playercard" style={cardStyle}>
              <div className="playercard-image" style={imageStyle}>&#xe900;</div>
              <div className="playercard-name" style={nameStyle}>{player.name}</div>           
            </div>
          );
        })}
      </div>
    </div>    
  );
};


export default ActivePlayerScreen;
