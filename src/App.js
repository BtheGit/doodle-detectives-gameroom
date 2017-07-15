import React, { Component } from 'react';
import Chatroom from './components/Chatroom.js';
import Drawingboard from './components/Drawingboard.js';
import StatusPanel from './components/StatusPanel.js';
import io from 'socket.io-client';
import './App.css';

//For now, I will handle all server communication and global state from here
//Could potentially be pushed off to redux and middleware later
class App extends Component {
  constructor(props) {
    super(props);
    this.socket = null;
    this.state = { 
      socketId: '',
      myId: '', //TEMP until auth and persistent login (necessary for self-identifying in state updates)
      myName: '',
      myColor: 'black',
      //If coming from newroom route, no id will be provided, default to empty string
      sessionId: '', //this.props.match.params.id || 
      score: 0,
      chatMessages: [],
      hasVotedToBegin: false, //Used for conditionally rendering status display after voting
      sessionState: {
        players: [],
        currentSessionStatus: '', //['isWaitingForPlayers', 'isWaitingToStart', 'isGameActive']
      },
      gameState: {
        currentPhase: '', 
        currentColor: '', //Player color (name is still secret)
        isMyTurn: false,
        fakeIsMe: false,
        secret: {
          category: '',
          secret: ''
        }
      }
    }
  }

  //################ SOCKET METHODS #####################

  //Initiate Socket Connection
  setupSocket() {
    this.socket = io('/gameroom');
    this.socket.on('connect', () => {
      this.socket.emit('setup_client')
    });
    this.socket.on('packet', this.handleSocketMessages)
  }

  //Socket Handlers
  handleSocketMessages = packet => {
    if(packet.type === 'setup_client') {
      //The color here is only for the waiting period. In game a new color will be assigned.
      this.setState({
        sessionId: packet.payload.sessionId,
        myId: packet.payload.clientId,
        myName: packet.payload.clientName,
        myColor: packet.payload.color,
        chatMessages: packet.payload.chatLog
      });
    }
    else if(packet.type === 'temp_get_myid'){
      this.setState({myId: packet.id})
    }
    else if (packet.type === 'broadcast_session') {
      this.handleSessionUpdate(packet.clients)
    }
    else if(packet.type ==='chat_message') {
      this.handleChatMessage(packet.payload);
    }
    else if(packet.type === 'path') {
      this.handlePath(packet.payload);
    }
    else if(packet.type === 'session_state_update') {
      this.handleSessionStateUpdate(packet.sessionState);
    }
    else if(packet.type === 'game_state_update') {
      //set local isGameActive toggle here which will prevent drawing unless activePlayer is me
      this.handleGameStateUpdate(packet.gameState);
    }
    else if(packet.type === 'display_secret_phase') {
      this.handleDisplaySecretPhase(packet.payload);
    }
    else if(packet.type === 'next_turn') {
      // Check if I am active player and toggle if true. (Can change the background color or 
      // something dramatic later)
      // Set Timeout (TODO create countdown timer and activate countdown sequence instead)
      // At the end set active state back to false
      // Send message back to server socket to trigger next turn action
    }
  }

  handleDisplaySecretPhase = secret => {
    //TODO: Pop up a modal, countdown, etc.
    this.setState({gameState: {...this.state.gameState, secret}})
  }


  handleGameStateUpdate = gameState => {
    const newState = {
      currentPhase: gameState.currentPhase,
      currentColor: gameState.currentColor === this.state.myColor ? 'Me' : gameState.currentColor,
      isMyTurn: gameState.currentId === this.state.myId,
    }
    this.setState({gameState: {...this.state.gameState, newState}})
  }

  //Handle new remote clients joining session or leaving session
  //Create a filtered list of remote peers
  //TODO? Can add more player state info through this function if needed later
  handleSessionUpdate = clients => {
    const myId = clients.self;
    const peers = clients.players.filter(player => player.id !== myId)
    this.setState({playerList: peers})
    console.log('Playerlist updated', this.state.playerList)
  }

  handleSessionStateUpdate = sessionState => {
    //Do I need to filter local client out?
    // sessionState.players = sessionState.players.filter(player => player.id !== this.state.myId)
    this.setState({sessionState})
  }

  handleChatMessage = message => {
    this.setState({chatMessages: [...this.state.chatMessages, message]})
  }

  //TODO: For now I will use this hack to access the child component method
  handlePath = path => {
    this.drawingboard.drawPath(path)
  }

  //Socket Emitters
  emitChatMessage = content => {
    const packet = {
      type: 'chat_message',
      payload: {
        name: this.state.myName,
        id: this.state.socketId,
        time: Date.now(),
        content
      }
    };

    this.socket.emit('packet', packet);
  }

  emitPath = path => {
    const packet = {
      type: 'path',
      payload: path
    };

    this.socket.emit('packet', packet);      
  }

  emitVoteToBegin = () => {
    //TODO Toggle Display (need to reset this when game initializes!)
    this.setState({hasVotedToBegin: true});
    const packet = {
      type: 'vote_to_begin',
    }
    this.socket.emit('packet', packet);
  }

  //############### LIFECYCLE AND RENDER METHODS ####################
  componentDidMount = () => {
    this.setupSocket();
  }

  componentWillUnmount = () => {
    this.socket.disconnect();
  }

  renderDrawingboard() {
    return (
      <Drawingboard 
        playerName =    {this.state.myName}
        onRef =         {ref => (this.drawingboard = ref)}
        emitPath =      {this.emitPath}
        clientColor =   {this.state.myColor}
        clientId =      {this.state.socketId}
        sessionStatus = {this.state.sessionState.currentSessionStatus}
        isMyTurn =      {this.state.gameState.isMyTurn}
      />
    )
  }

  renderChatroom() {
    return (
      <Chatroom 
        messages = {this.state.chatMessages}
        emitChatMessage = {this.emitChatMessage}
      />     
    )
  }

  //COMPONENTIZE THE STATUS DISPLAY POST HASTE
  selectStatusDisplay() {
    const currentState = this.state.sessionState.currentSessionStatus; //for brevity
    if(currentState === 'isGameActive') {
      return (
        <StatusPanel 
          turnColor = {this.state.gameState.turnColor}
          secret = {this.state.gameState.secret}
        />
      ); //This will not be a message. Showing turns/clues/etc. //GAME STATUS COMPONENT
    }
    else { //SESSION STATUS COMPONENT
      if(currentState === 'isWaitingForPlayers') {
        return this.renderStatusMessage('Waiting for Players');
      } 
      else if (currentState === 'isWaitingToStart') {
        return !this.state.hasVotedToBegin ? this.renderVoteToBegin() 
                                     : this.renderStatusMessage('Waiting for other players to vote.')
      }
      else {
        return this.renderStatusMessage('Waiting for Server...');
      }
    }
  }

  renderStatusDisplay() {
    return (
      <div className='statusdisplay-container'>
        {this.selectStatusDisplay()}
      </div>
    )
  }

  renderStatusMessage(message) {
    return <div className="statusdisplay-message">{message}</div>
  }

  renderVoteToBegin() {
    return(
      <div className='statusdisplay-votetobegin-container'>
        <button onClick={this.emitVoteToBegin}>Begin</button>
        <div>Vote 'Begin' to get this party started! Game will commence when all players vote.</div>
      </div>
    )
  }

  render() {
    return (
      <div id="room-container">
        {this.renderDrawingboard()}
        <div id="sidebar-container">
          {this.renderChatroom()}
          {this.renderStatusDisplay()}
        </div>        
      </div>
    );
  }
}


export default App;