import React from 'react';
import ReactDOM from 'react-dom';
import registerServiceWorker from './registerServiceWorker';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import 'whatwg-fetch'; //Polyfill for fetch()
// import { composeWithDevTools } from 'redux-devtools-extension';
import gameReducer from './redux/reducers/gameReducer.js';
import App from './App';
import './index.css';



//TODO? save store state to localstorage after every action. Restore by injecting
//localstorage as initialstate when creating store below (if exists)
//PROBLEM = if it no longer relevant (from old game/room) would need to check if still pertinent
//Or more likely retrieve it from server (can dispatch copy of state to server after each action, then
//have localstorage only keep user details, verify with server and receive saved state)

const rootReducer = combineReducers({
	gameReducer
});

const store = createStore(
	rootReducer,
	applyMiddleware(thunk)
);


ReactDOM.render(
		<Provider store={store}>
				<App />
		</Provider>,
	document.getElementById('root')
);
registerServiceWorker();

