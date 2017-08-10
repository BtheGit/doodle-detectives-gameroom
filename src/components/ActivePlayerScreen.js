import React, { Component } from 'react';
import PropTypes from 'prop-types';
import PlayerCard from './PlayerCard';
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

    const isVoting = this.props.isVoting && !this.props.hasVoted;

    return (
      <div className={`activeplayer-container ${isVoting ? 'voting' : ''}`}>
        <div className="activeplayer-header">SUSPECTS</div>
        <div className="activeplayer-players">
          {this.props.players.map((player, idx) => {
            const active = this.props.active === player.name;
            const cardStyle = {
              transform:`rotate(${this.tilts[idx]}deg) ${active ? 'scale(1.2)' : ''}`
            }
            const imageStyle = {
              color: this.props.playerColors[player.id] || 'white'
            }
            const nameStyle = {
              color: this.props.playerColors[player.id] || 'black'
            }           
            return (
              <PlayerCard 
                key={idx}
                cardStyle={cardStyle}
                imageStyle={imageStyle}
                nameStyle={nameStyle}
                color={this.props.playerColors[player.id]}
                vote={this.props.vote}
                name={player.name}
                active={active}
              />
            );
          })}
        </div>
        <div className="fakevote-header">Who was faking?</div>
      </div>    
    );   
  }
}

ActivePlayerScreen.propTypes = {
  players: PropTypes.array,
  playerColors: PropTypes.object,
  isVoting: PropTypes.bool.isRequired,
  hasVoted: PropTypes.bool.isRequired
}



export default ActivePlayerScreen;
