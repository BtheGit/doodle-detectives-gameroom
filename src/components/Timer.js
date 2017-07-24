import React, { Component } from 'react';

class Timer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      INTERVAL: 1000,
      timerLength: this.props.length || 0,
      endTime: Date.now() + (this.props.length * this.INTERVAL),
      then: Date.now(),
      timeRemaining: this.props.length,
      animationFrameId: null
    }
  }

  frame = () => {
    cancelAnimationFrame(this.state.animationFrameId)
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

  componentDidMount = () => {
    this.frame()
  }

  tick = () => {
    if(this.props.tickCB) this.props.tickCB();
    console.log('tick')
  }

  timerFinished = () => {
    if(this.props.endCB) this.props.endCB();
    console.log('Timer Finished')
  }

  render() {
    return (
      <div className="timer-display">
        {this.state.timeRemaining}
      </div>
    )
  }
}

export default Timer;