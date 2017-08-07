import React, { Component } from 'react';
import '../styles/ActivePlayerScreen.css';

class ActivePlayerScreen extends Component {
  constructor(props) {
    super(props);
    this.tilts = [];
  }

  generateRandomTilts(players) {
    const array = [];
    for(let i = 0; i < 8; i++) {
      array.push(Math.random() * (5 - -5) + -5);
    }
    return array;
  }

  componentWillMount() {
    this.tilts = this.generateRandomTilts();
  }


  render() {
    return (
      <div className="activeplayer-container">
        <div className="activeplayer-header">SUSPECTS</div>
        <div className="activeplayer-players">
          {this.props.players.map((player, idx) => {
            const cardStyle = {
              transform:`rotate(${this.tilts[idx]}deg)`
            }
            const imageStyle = {
              color: this.props.playerColors[player.id] || 'white'
            }
            const nameStyle = {
              color: this.props.playerColors[player.id] || 'black'
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
  }
}


export default ActivePlayerScreen;
