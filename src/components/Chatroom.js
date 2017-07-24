import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ChatOutput from './ChatOutput';

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
      <form id="chat-input" onSubmit={this.handleSubmit}>
        <input 
          id="message-box" 
          autoComplete="off"
          value={this.state.chatInputValue} 
          onChange={this.handleChatInput}
        />
      </form>        
    );
  };

  render() {
    return(
      <div id="chat-container">
        {this.renderChatOutput()}
        {this.renderChatInput()}
      </div>    
    );
  };
};

Chatroom.propTypes = {
  messages: PropTypes.array,
  emitChatMessage: PropTypes.func.isRequired
}

export default Chatroom;