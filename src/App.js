import React, { Component } from 'react';
import './App.css';
import io from 'socket.io-client';
import Modal from 'react-modal';
import Chatroom from './components/Chatroom.js';
// import StatusPanel from './components/StatusPanel.js';
import StatusDisplay from './components/StatusDisplay.js';
import Drawingboard from './components/Drawingboard.js';
// import FakeGuessForm from './components/FakeGuessForm.js';
// import GuessApprovalForm from './components/GuessApprovalForm.js';
import ActivePlayerScreen from './components/ActivePlayerScreen.js';

//Game State Toggles
const DISPLAYSECRET = 'DISPLAYSECRET',
      DRAWING       = 'DRAWING',
      FAKEVOTE      = 'FAKEVOTE',
      GUESSVOTE     = 'GUESSVOTE',
      GUESSAPPROVAL = 'GUESSAPPROVAL',
      GAMEOVER      = 'GAMEOVER';

//Session State Toggles
// const GAMEACTIVE        = 'GAMEACTIVE',
//       WAITINGTOSTART    = 'WAITINGTOSTART',
//       WAITINGFORPLAYERS = 'WAITINGFORPLAYERS';

class App extends Component {
  constructor(props) {
    super(props);
    this.socket = null;
    this.state = {
      isModalActive: false,
      modalContent: '',
      socketId: '',
      myId: '', //TEMP until auth and persistent login (necessary for self-identifying in state updates)
      myName: '',
      myColor: 'black',
      //If coming from newroom route, no id will be provided, default to empty string
      sessionId: '', //this.props.match.params.id || 
      score: 0,
      chatMessages: [],
      paths: [],
      hasVotedToBegin: false, //Used for conditionally rendering status display after voting
      sessionState: {
        players: [],
        currentSessionStatus: '', //[WAITINGFORPLAYERS, WAITINGTOSTART, GAMEACTIVE]
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
      },
      fakeGuess: {
        hasGuessed: false,
      },
      guessApproval: {
        hasVoted: false,
        guess: ''
      },
      finalResults: {
        players: [],
        isFakeFound: false,
        isFakeWinner: false
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
        chatMessages: packet.payload.chatLog,
        paths: packet.payload.paths
      }, 
      this.drawingboard.refresh);
    }
    else if (packet.type === 'game_will_start') {
      this.handleGameWillStart();
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
    else if(packet.type === 'display_secret_phase') {
      this.handleDisplaySecretPhase(packet.payload);
    }
    else if(packet.type === 'next_turn') {
      this.handleNextTurn(packet.payload)
    }
    else if(packet.type === 'initiate_fake_vote') {
      this.handleFakeVoting(packet.players)
    }
    else if(packet.type === 'prompt_fake_for_guess'){
      this.handlePromptFakeForGuess();
    }
    else if(packet.type === 'get_approval_for_fake_guess'){
      this.handleFakeGuessApprovalRequest(packet.guess);
    }
    else if(packet.type === 'game_over'){
      this.handleGameOver(packet.payload);
    }
  }

  //############### SOCKET HANDLERS #################
  handleGameWillStart = () => {
    this.clearPaths();
    this.drawingboard.refresh();
  }
  
  handleGameOver = payload => {
    console.log('Game Over. Receiving final results', payload)
    this.setState({
      gameState: {
        ...this.state.gameState,
        currentPhase: GAMEOVER
      },
      finalResults: payload,
      hasVotedToBegin: false
    });
    //Trigger Modal
    const modalContent = this.styleModal(payload.isFakeWinner, payload.isFakeFound, payload.players);
    this.setState({
      isModalActive: true,
      modalContent
    })
  }

  styleModal(fakeWins, fakeFound, players) {
    function resultMessage(fakeWins, fakeFound) {
      if(fakeWins) {
        if(fakeFound) {
          return 'The fake artist was uncovered but guessed the secret correctly to steal the win.'
        }
        else {
          return 'The fake artist was never found. A sound defeat for the art of deduction.'
        }
      }
      else {
        return 'The fake artist was found and failed to discover the secret. A great victory for the forces of deduction.'
      }
    }

    function displayPlayers(players) {
      //Dynamically show players in their respective color, with fake bolded
      return players.map((player, idx) => {
        //available properties: {color, name, isFake}
        const divStyle = {
          color: player.color,
        };
        const classNameCon = `modal-result-players player ${player.isFake ? 'fake-player' : ''}`;

        return (
          <div className={classNameCon}>
            <div style={divStyle} key={idx}>{player.name}</div>
          </div>
        )
      })
    }

    const modalContent = (
      <div className="modal-content">
        <div className="modal-header">Game Over</div>
        <div className="modal-result-text">{resultMessage(fakeWins, fakeFound)}</div>
        <div className="modal-result-players">{displayPlayers(players)}</div>
      </div>
    )

    return modalContent;
  }

  handleFakeGuessApprovalRequest = guess => {
    console.log("Requesting approval of Fake's guess");
    this.setState({
      gameState: {
        ...this.state.gameState,
        currentPhase: GUESSAPPROVAL
      },
      guessApproval: {
        ...this.state.guessApproval,
        guess
      }
    })
  }

  handlePromptFakeForGuess = () => {
    console.log('Prompting Fake For Guess')
    this.setState({
      gameState: {
        ...this.state.gameState,
        currentPhase: GUESSVOTE
      }
    });
    //(Set timeout for 15 seconds (later display counter), if no guess, send NOGUESS to server)
    //If I am fake, prompt me by showing form to guess
    //If I am not fake, display status message Waiting for Fake to Guess
  }

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

  handleDisplaySecretPhase = payload => {
    //TODO: Pop up a modal, countdown, etc.
    this.setState({
      gameState: {
        ...this.state.gameState, 
        secret: payload.secret,
        fakeIsMe: payload.fakeIsMe,
        currentPhase: DISPLAYSECRET
      }
    })
  }

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

  handlePath = path => {
    this.savePath(path)
    this.drawingboard.drawPath(path) //Allows us to reach into the child component's functions. Dirty-boy!
  }

  savePath = path => {
    this.setState({paths: [...this.state.paths, path]})
  }

  clearPaths = () => {
    this.setState({paths: []})
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
    this.savePath(path);
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

  emitGuess = guess => {
    console.log('Emitting guess', guess);
    this.setState({fakeGuess: {
      hasGuessed: true
    }});
    const packet = {
      type: 'fake_guess',
      guess
    };
    this.socket.emit('packet', packet);
  }

  emitVoteForGuessApproval = vote => {
    console.log('Emitting guess approval vote of', vote)
    this.setState({
      guessApproval: {
        ...this.state.guessApproval,
        hasVoted: true
      }
    });
    const packet = {
      type: 'guess_approval_vote',
      vote
    };
    this.socket.emit('packet', packet);
  }

  closeModal = () => {
    this.setState({isModalActive: false})
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
        playerName    = {this.state.myName}
        onRef         = {ref => (this.drawingboard = ref)}
        emitPath      = {this.emitPath}
        clientColor   = {this.state.myColor}
        clientId      = {this.state.socketId}
        sessionStatus = {this.state.sessionState.currentSessionStatus}
        isMyTurn      = {this.state.gameState.isMyTurn}
        paths         = {this.state.paths}
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

  renderActivePlayerScreen() {
    return (
      <ActivePlayerScreen
        players={this.state.sessionState.players}
      />
    )
  }

  renderModal() {
    return (
      <Modal 
        isOpen={this.state.isModalActive}
        onRequestClose={this.closeModal}
        className='modal'
        overlayClassName='modal-overlay'
      >
        {this.state.modalContent}
      </Modal>
    )
  }

  //COMPONENTIZE THE STATUS DISPLAY POST HASTE
  // selectStatusDisplay() {
  //   const currentState = this.state.sessionState.currentSessionStatus; //for brevity
  //   if (currentState === GAMEACTIVE) {
  //     const phase = this.state.gameState.currentPhase;
  //     if (phase === DRAWING || phase === DISPLAYSECRET) {
  //       return (
  //         <StatusPanel 
  //           currentColor = {this.state.gameState.currentColor}
  //           secret = {this.state.gameState.secret}
  //         />
  //       ); //This will not be a message. Showing turns/clues/etc. //GAME STATUS COMPONENT       
  //     }
  //     else if (phase === FAKEVOTE) {
  //       return this.renderVoteForFake();
  //     }
  //     else if (phase === GUESSVOTE) {
  //       if(this.state.gameState.fakeIsMe) {
  //         if(!this.state.fakeGuess.hasGuessed) {
  //           //Show Form component to receive guess
  //           return this.renderFormForFakeGuess();
  //         }
  //         else {
  //           return this.renderStatusMessage('Guess submitted. Waiting for approval...');
  //         }
  //       }
  //       else {
  //         return this.renderStatusMessage('Waiting for fake to guess...');
  //       }
  //     }
  //     else if (phase === GUESSAPPROVAL) {
  //       if(!this.state.gameState.fakeIsMe) {
  //         if(!this.state.guessApproval.hasVoted) {
  //           return this.renderGuessApprovalForm();
  //         }
  //         else {
  //           return this.renderStatusMessage('Approval vote sent. Waiting for other players to vote...')
  //         }
  //       }
  //       else {
  //         //I am the fake. Don't let me vote to approve my own guess!
  //         return this.renderStatusMessage('Guess submitted. Waiting for approval...');
  //       }
  //     }
  //     else if (phase === GAMEOVER) {
  //       //render vote to start new game ()
  //       return this.renderStatusMessage('Game Over')
  //     }
  //   }
  //   else { //SESSION STATUS COMPONENT
  //     if (currentState === WAITINGFORPLAYERS) {
  //       return this.renderStatusMessage('Waiting for Players');
  //     } 
  //     else if (currentState === WAITINGTOSTART) {
  //       return !this.state.hasVotedToBegin ? this.renderVoteToBegin() 
  //                                    : this.renderStatusMessage('Waiting for other players to vote...');
  //     }
  //     else {
  //       return this.renderStatusMessage('Waiting for Server...');
  //     }
  //   }
  // }

  // renderStatusDisplay() {
  //   return (
  //     <div className='statusdisplay-container'>
  //       {this.selectStatusDisplay()}
  //     </div>
  //   )
  // }
  renderStatusDisplay() {
    return (
      <StatusDisplay
        currentState={this.state.sessionState.currentSessionStatus}
        currentPhase={this.state.gameState.currentPhase}
        currentColor = {this.state.gameState.currentColor}
        secret = {this.state.gameState.secret}
        fakeIsMe={this.state.gameState.fakeIsMe}
        hasVotedToBegin={this.state.hasVotedToBegin}
        emitVoteToBegin={this.emitVoteToBegin}
        fakeVote={this.state.fakeVote}
        emitVoteForFake={this.emitVoteForFake}
        emitVoteForGuessApproval={this.emitVoteForGuessApproval}
        emitGuess={this.emitGuess}
        hasGuessed={this.state.fakeGuess.hasGuessed}
        guessApproval={this.state.guessApproval}
      />
    )
  }

  // renderStatusMessage(message) {
  //   return <div className="statusdisplay-message">{message}</div>
  // }

  // renderVoteToBegin() {
  //   return(
  //     <div className='statusdisplay-votetobegin'>
  //       <button onClick={this.emitVoteToBegin}>Begin</button>
  //       <div>Vote 'Begin' to get this party started! Game will commence when all players vote.</div>
  //     </div>
  //   )
  // }

  // renderVoteForFake() {
  //   if (!this.state.fakeVote.hasVoted) {
  //     const opts = this.state.fakeVote.options.map(opt => {
  //       return <button onClick={this.emitVoteForFake}>{opt}</button>
  //     })
  //     return (
  //       <div className='statusdisplay-voteforfake'>
  //         <h2>Who was faking?</h2>
  //         {opts}
  //       </div>
  //     )     
  //   }
  //   else {
  //     return this.renderStatusMessage('Waiting for other players to vote...')
  //   }
  // }

  // renderFormForFakeGuess() {
  //   return(
  //     <div className="statusdisplay-fakeguess">
  //       <h2>You were Found!</h2>
  //       <p>You have one chance to steal the win if you can guess the secret clue correctly</p>
  //       <FakeGuessForm 
  //         submitFakeGuess={this.emitGuess}
  //       />
  //     </div>
  //   )
  // }

  // renderGuessApprovalForm() {
  //   return(
  //     <div className="statusdisplay-guessapprovalform">
  //       <GuessApprovalForm
  //         secret={this.state.gameState.secret.secret}
  //         guess={this.state.guessApproval.guess}
  //         submitGuessApproval={this.emitVoteForGuessApproval}
  //       />
  //     </div>
  //   )
  // }

  render() {
    return (
      <div id="room-container">
        {this.renderDrawingboard()}
        <div id="sidebar-container">
          {this.renderChatroom()}
          {this.renderActivePlayerScreen()}
          {this.renderStatusDisplay()}
        </div>        
        {this.renderModal()}
      </div>
    );
  }
}


export default App;