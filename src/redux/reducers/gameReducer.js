const initialState = {
	//Extract to separate reducer later
	playerName: '',
	playerId: '', 
	playerScore: 0,
	//game reducer stuff
	playerColor: '',
	players: [], //array of objects with keys NAME/COLOR
	isWaitingForPlayers: false,
	isInGame: false,
	isMyTurn: false,
	isFake: false,
	clue: '',
};

const gameReducer = (state = initialState, action) => {
	switch(action.type) {
		case 'SET_PLAYER_NAME':
			return ({
				...state,
				playerName: action.payload
			});
		case 'UPDATE_SCORE':
			return({
				...state,
				playerScore: state.playerScore + action.payload
			});
		default:
			return state;
	}
}

export default gameReducer;