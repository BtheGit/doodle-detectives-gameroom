import React from 'react';

const PlayerCard = props => {

	const handleClick = e => {
		props.vote(props.color)
	}

	return (
    <div className={`playercard ${props.active ? 'active': ''}`} style={props.cardStyle} onClick={handleClick}>
      <div className="playercard-image" style={props.imageStyle}>&#xe900;</div>
      <div className="playercard-name" style={props.nameStyle}>{props.name}</div>           
    </div>
	)
}

export default PlayerCard;