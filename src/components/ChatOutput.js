import React from 'react';
import PropTypes from 'prop-types';

class ChatOutput extends React.Component {
  constructor(props) {
    super(props);
    this.shouldScrollDown = false;
    this.display = null;
  }

  componentDidMount() {
    this.display = document.getElementById('chat-display')
  }

  componentWillUpdate() {
    this.shouldScrollDown = this.display.offsetHeight + this.display.scrollTop >= this.display.scrollHeight;
  }

  componentDidUpdate() {
    if(this.shouldScrollDown) {
      this.display.scrollTop = this.display.scrollHeight;
    }
  }

  renderMessage(message, index) {
    const isSysMessage = !message.hasOwnProperty('name');
    return (
      <div className={`chat-message ${isSysMessage ? 'sys-message' : ''}`} key={index}>
        <div className='chat-message-name'>{message.name}</div> 
        <div className='chat-message-content'>{message.content}</div>
      </div>
    )
  }

  render() {
    return (
      <div className="chat-display" id="chat-display">
        {this.props.messages.map((message, index) => {
          return this.renderMessage(message, index)
        })}
      </div>    
    );
  }
}

ChatOutput.propTypes = {
  messages: PropTypes.array,
}

export default ChatOutput;


