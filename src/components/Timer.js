import React, { Component } from 'react';
import PropTypes from 'prop-types';

class Timer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      INTERVAL: 1000,
      timerLength: this.props.length || 0,
      endTime: Date.now() + (this.props.length * this.INTERVAL),
      then: Date.now(),
      timeRemaining: this.props.length,
      animationFrameId: null,
      timerId: this.props.timerId
    }
  }

  frame = () => {
    cancelAnimationFrame(this.state.animationFrameId)
    if(this.state.timerId === this.props.timerId) {
      if(this.state.timeRemaining) {
        const animationFrameId = requestAnimationFrame(this.frame);
        let now = Date.now();
        let delta = now - this.state.then;
        this.setState({animationFrameId})

        if (delta > this.state.INTERVAL) {
          const then = now - (delta % this.state.INTERVAL);
          const timeRemaining = this.state.timeRemaining - 1;
          this.setState({then, timeRemaining}, this.tick)
        }
      }
      else {
        this.setState({timeRemaining: 0}, this.timerFinished)
      }
    }
  }

  componentDidMount = () => {
    this.frame()
  }

  tick = () => {
    if(this.props.tickCB) this.props.tickCB();
  }

  timerFinished = () => {
    if(this.props.endCB) this.props.endCB();
  }

  render() {
    return (
      <div className="timer-display">
        {this.state.timeRemaining}
      </div>
    )
  }
}

Timer.propTypes = {
  length: PropTypes.number.isRequired,
  tickCB: PropTypes.func,
  endCB: PropTypes.func
}

export default Timer;