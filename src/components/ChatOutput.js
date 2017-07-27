import React from 'react';

const ChatOutput = (props) => {
  return (
    <div className="chat-display">
      {props.messages.map((message, index) => {
        return (
          <div className='chat-message' key={index}>
            <div className='chat-message-name'>{message.name}</div> 
            <div className='chat-message-content'>{message.content}</div>
          </div>
        )
      })}
    </div>    
  );
};

export default ChatOutput;
