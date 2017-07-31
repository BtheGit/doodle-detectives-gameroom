import React from 'react';

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

  render() {
    return (
      <div className="chat-display" id="chat-display">
        {this.props.messages.map((message, index) => {
          return (
            <div className='chat-message' key={index}>
              <div className='chat-message-name'>{message.name}</div> 
              <div className='chat-message-content'>{message.content}</div>
            </div>
          )
        })}
      </div>    
    );
  }
}

export default ChatOutput;


