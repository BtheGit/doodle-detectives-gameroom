import React from 'react';
import ReactDOM from 'react-dom';
// import registerServiceWorker from './registerServiceWorker';
// import 'whatwg-fetch'; //Polyfill for fetch()
import App from './App';
import AssetLoader from './components/AssetLoader';
import './index.css';

ReactDOM.render(<AssetLoader><App /></AssetLoader>,document.getElementById('root'));
// registerServiceWorker();

