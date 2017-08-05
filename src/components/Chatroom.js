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
      this.props.emitChatMessage(this.state.chatInputValue);
      this.setState({chatInputValue: ''});      
    }
  }

  handleSubmit = (e) =>  {
    e.preventDefault();
    this.props.emitChatMessage(this.state.chatInputValue);
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
            placeholder="Type your message here..."
            value={this.state.chatInputValue}
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
          {this.renderChatOutput()}
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