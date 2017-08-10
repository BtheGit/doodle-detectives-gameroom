import React from 'react';
import '../styles/Spinner.css';

const Spinner = () => {
	return (
	  <div className="loading-bg">
	    <div id="loading-spinner">
	      <div className="spin-element spinner1"></div>
	      <div className="spin-element spinner2"></div>
	    </div>
	  </div>
	)
}

export default Spinner;
