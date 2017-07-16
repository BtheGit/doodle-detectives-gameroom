import React, { Component } from 'react';
import Chatroom from './components/Chatroom.js';
import Drawingboard from './components/Drawingboard.js';
import StatusPanel from './components/StatusPanel.js';
import io from 'socket.io-client';
import './App.css';

const DISPLAYSECRET = 'DISPLAYSECRET',
      DRAWING       = 'DRAWING',
      FAKEVOTE      = 'FAKEVOTE',
      GUESSVOTE     = 'GUESSVOTE',
      GAMEOVER      = 'GAMEOVER';
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
      },
      fakeVote: {
        hasVoted: false,
        options: [],
      }
    }
  }

  //################ SOCKET HELPERS #####################

  //Initiate Socket Connection
  setupSocket() {
    this.socket = io('/gameroom');
    this.socket.on('connect', () => {
      this.socket.emit('setup_client')
    });
    this.socket.on('packet', this.handleSocketMessages)
  }

  //############### SOCKET SWITCH ##################
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
    // else if(packet.type === 'game_state_update') {
    //   //set local isGameActive toggle here which will prevent drawing unless activePlayer is me
    //   this.handleGameStateUpdate(packet.gameState);
    // }
    else if(packet.type === 'display_secret_phase') {
      this.handleDisplaySecretPhase(packet.payload);
    }
    else if(packet.type === 'next_turn') {
      this.handleNextTurn(packet.payload)
    }
    else if(packet.type === 'initiate_fake_vote') {
      this.handleFakeVoting(packet.players)
    }
  }

  //############### SOCKET HANDLERS #################
  handleFakeVoting = players => {
    console.log('Fake Voting Phase')
    this.setState({
      gameState: {
        ...this.state.gameState,
        currentPhase: FAKEVOTE
      }
    })
    this.setState({
      fakeVote: {
        hasVoted: false,
        options: players
      }
    })
  }

  handleNextTurn = turn => {
      // Check if I am active player and toggle if true. (Can change the background color or 
      // something dramatic later)
      const newState = {
        currentColor: turn.color,
        isMyTurn: turn.active,
        currentPhase: DRAWING
      }
      this.setState({
        gameState: {
          ...this.state.gameState, 
          ...newState
        }
      })
      // Set Timeout (TODO create countdown timer and activate countdown sequence instead)
      setTimeout(this.emitEndOfTurn, 1000)
  }

  handleDisplaySecretPhase = secret => {
    //TODO: Pop up a modal, countdown, etc.
    this.setState({
      gameState: {
        ...this.state.gameState, 
        secret,
        currentPhase: DISPLAYSECRET
      }
    })
  }


  // handleGameStateUpdate = gameState => {
  //   const newState = {
  //     currentPhase: gameState.currentPhase,
  //     currentColor: gameState.currentColor === this.state.myColor ? 'Me' : gameState.currentColor,
  //     isMyTurn: gameState.currentId === this.state.myId,
  //   }
  //   this.setState({gameState: {...this.state.gameState, ...newState}})
  //   console.log(this.state)
  // }

  //Handle new remote clients joining session or leaving session
  //Create a filtered list of remote peers
  //TODO? Can add more player state info through this function if needed later
  handleSessionUpdate = clients => {
    const myId = clients.self;
    const peers = clients.players.filter(player => player.id !== myId)
    this.setState({playerList: peers})
  }

  handleSessionStateUpdate = sessionState => {
    this.setState({sessionState})
  }

  handleChatMessage = message => {
    this.setState({
      chatMessages: [...this.state.chatMessages, message]
    })
  }

  //TODO: For now I will use this hack to access the child component method
  handlePath = path => {
    this.drawingboard.drawPath(path)
  }

  //########### SOCKET EMITTERS ##############
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

  emitEndOfTurn = () => {
    console.log('Turn finished')
    // At the end set active state back to false
    const newState = {
      isMyTurn: false, 
      currentColor: ''
    }
    this.setState({gameState: {...this.state.gameState, ...newState}})
    // Send message back to server socket to trigger next turn action
    const packet = {
      type: 'end_of_turn'
    }    
    this.socket.emit('packet', packet)
  }

  emitVoteForFake = e => {
    const vote = e.target.innerHTML;
    const packet = {
      type: 'vote_for_fake',
      vote
    }
    this.socket.emit('packet', packet)
    this.setState({
      fakeVote: {
        ...this.state.fakeVote,
        hasVoted: true
      }
    })
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
    if (currentState === 'isGameActive') {
      const phase = this.state.gameState.currentPhase;
      if (phase === DRAWING || phase === DISPLAYSECRET) {
        return (
          <StatusPanel 
            currentColor = {this.state.gameState.currentColor}
            secret = {this.state.gameState.secret}
          />
        ); //This will not be a message. Showing turns/clues/etc. //GAME STATUS COMPONENT       
      }
      else if (phase === FAKEVOTE) {
        return this.renderVoteForFake()
      }
    }
    else { //SESSION STATUS COMPONENT
      if (currentState === 'isWaitingForPlayers') {
        return this.renderStatusMessage('Waiting for Players');
      } 
      else if (currentState === 'isWaitingToStart') {
        return !this.state.hasVotedToBegin ? this.renderVoteToBegin() 
                                     : this.renderStatusMessage('Waiting for other players to vote...')
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
      <div className='statusdisplay-votetobegin'>
        <button onClick={this.emitVoteToBegin}>Begin</button>
        <div>Vote 'Begin' to get this party started! Game will commence when all players vote.</div>
      </div>
    )
  }

  renderVoteForFake() {
    if (!this.state.fakeVote.hasVoted) {
      const opts = this.state.fakeVote.options.map(opt => {
        return <button onClick={this.emitVoteForFake}>{opt}</button>
      })
      return (
        <div className='statusdisplay-voteforfake'>
          <h2>Who was faking?</h2>
          {opts}
        </div>
      )     
    }
    else {
      return this.renderStatusMessage('Waiting for other players to vote...')
    }
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