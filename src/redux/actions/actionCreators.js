import 'whatwg-fetch';

//sync

export function updateScore(score) {
	return({
		type: 'UPDATE_SCORE',
		payload: score
	});
};

export function setPlayerName(name) {
	return({
		type: 'SET_PLAYER_NAME',
		payload: name
	});
};

//async
export function playerLogin(name) {
	return function (dispatch) {
		dispatch(setPlayerName(name));
		localStorage.setItem('localClient', JSON.stringify({name}))
	};
};

export function playerLogout() {
	return function (dispatch) {
		dispatch(setPlayerName(''));
		localStorage.clear();
	};
};