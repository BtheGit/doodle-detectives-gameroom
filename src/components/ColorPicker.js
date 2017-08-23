import React, { Component } from 'react';
import { ChromePicker } from 'react-color';

class ColorPicker extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpen: false
    }
  }

  handleClick = () => {
    this.setState({isOpen: !this.state.isOpen})
  }

  handleClose = () => {
    this.setState({isOpen: false})
  }

  renderPicker() {
    return (
      <div className="color-picker-popout">
        <div onClick={this.handleClose}></div>
        <ChromePicker
          color = {this.props.color}
          onChangeComplete={this.props.setColor}
        />
      </div>
    )
  }

  render() {
    return(
      <div className="color-picker-container">
        <div className="color-picker-select" onClick={this.handleClick}>{this.state.isOpen ? <div>&#xf00d;</div> : <div>&#xf1fb;</div>}</div>
        {this.state.isOpen ? this.renderPicker() : null}
      </div>
    )
  }
}

export default ColorPicker;