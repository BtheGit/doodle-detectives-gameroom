import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ChatOutput from './ChatOutput';
import '../styles/ChatRoom.css';


class Chatroom extends Component {
  constructor(props) {
    super();
    this.state = {
      chatInputValue: '',
    };
  };

  handleChatInput = (e) => {
    this.setState({chatInputValue: e.target.value});
  };

  keyPress = (e) => {
    if (e.keyCode === 13) {
      e.preventDefault()
      //Don't send if it is empty or all whitespace
      if(this.state.chatInputValue.length && this.state.chatInputValue.trim()) {
        this.props.emitChatMessage(this.state.chatInputValue);
      }
      this.setState({chatInputValue: ''});      
    }
  }

  handleSubmit = (e) =>  {
    e.preventDefault();
    if(this.state.chatInputValue.length && this.state.chatInputValue.trim()) {
      this.props.emitChatMessage(this.state.chatInputValue);
    }
    this.setState({chatInputValue: ''});
  };

  //########## LIFECYCLE & RENDER METHODS ##################

  renderChatOutput() {
    return(
      <ChatOutput 
        messages = {this.props.messages}
      />
    );
  };

  renderChatInput() {
    return(
      <div className="chat-input">
        <form onSubmit={this.handleSubmit}>
          <textarea 
            id="message-box" 
            autoComplete="off"
            maxLength='200'
            value={this.state.chatInputValue}
            placeholder=">> Input message here..."
            onKeyDown={this.keyPress}
            onChange={this.handleChatInput}
          />
        </form>
      </div>  
    );
  };

  render() {
    return(
      <div className="chat-container-outer">
        <div className="chat-container-inner">
          <div className="chat-display-container">
            {this.renderChatOutput()}
          </div>
          <div className="chat-container-middle">
            <div className="mac-diskdrive">
              <div className="drive-port"></div>
            </div>
            <div className="mac-diskdrive">
              <div className="drive-port"></div>
            </div>
          </div>
          {this.renderChatInput()}
        </div>
      </div>    
    );
  };
};

Chatroom.propTypes = {
  messages: PropTypes.array,
  emitChatMessage: PropTypes.func.isRequired
}

export default Chatroom;