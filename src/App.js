import React, { Component } from 'react';
import './styles/App.css';
import Modal from 'react-modal';
import io from 'socket.io-client';
import Timer from './components/Timer'
import Chatroom from './components/Chatroom';
import HelpModal from './components/HelpModal';
import BeginModal from './components/BeginModal';
import Drawingboard from './components/Drawingboard';
import ResultsModal from './components/ResultsModal';
import StatusDisplay from './components/StatusDisplay';
import GuessApprovalModal from './components/GuessApprovalModal';
import ActivePlayerScreen from './components/ActivePlayerScreen';


//Game State Toggles
const DISPLAYSECRET = 'DISPLAYSECRET',
      DRAWING       = 'DRAWING',
      FAKEVOTE      = 'FAKEVOTE',
      GUESSVOTE     = 'GUESSVOTE',
      GUESSAPPROVAL = 'GUESSAPPROVAL',
      GAMEOVER      = 'GAMEOVER';

//Session State Toggles
const GAMEACTIVE        = 'GAMEACTIVE',
      WAITINGTOSTART    = 'WAITINGTOSTART',
      WAITINGFORPLAYERS = 'WAITINGFORPLAYERS';

//Background phase toggles
const BG_GAME_NOTMYTURN = 'bg-gameactive',
      BG_GAME_MYTURN    = 'bg-gameactive-myturn',
      BG_NOGAME         = 'bg-nogame';

const TURNLENGTH = 15;

const INITIAL_GAME_STATE = {
  gameState: {
    hasVotedToReset: false,
    playerColors: {},
    currentPhase: '', 
    currentPlayer: '',
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

const INITIAL_MODAL_STATE = {
  isModalActive: false,
  isAbleToClose: true,
  modalContent: ''       
}

const INITIAL_TIMER_STATE = {
  isActive: false,
  length: 0,
  tickCB: null,
  endCB: null
}

class App extends Component {
  constructor(props) {
    super(props);
    this.socket = null;
    this.background = document.getElementById('canvas-container');
    this.state = {
      socketId: '',
      myId: '', 
      myName: '',
      myColor: 'black',
      sessionId: '', 
      score: 0,
      chatMessages: [],
      paths: [],
      hasVotedToBegin: false, 
      modal: INITIAL_MODAL_STATE,
      sessionState: {
        players: [],
        currentSessionStatus: '', 
      },
      gameState: INITIAL_GAME_STATE.gameState,
      fakeVote: INITIAL_GAME_STATE.fakeVote,
      fakeGuess: INITIAL_GAME_STATE.fakeGuess,
      guessApproval: INITIAL_GAME_STATE.guessApproval,
      finalResults: INITIAL_GAME_STATE.finalResults,
      timer: INITIAL_TIMER_STATE,
      statusMessage: ''
    }
  }

  //##########  TESTING/MOCKING FUNCTIONS
  
  testSetup(sessionStatus, gamePhase, active, fake) {
    this.setState({
      chatMessages: [
        {name: "Brendan", content: "Hello"},
        {content: "BRENDAN has voted to begin"},
        {name: "Jim", content: "How are you doing today?"},
        {name: "Brendan", content: "This game is silly. Let's do something else"},
        {name: "Hypatia", content: "Hello"},
        {name: "Brendan", content: "How are you doing today?"},
        {name: "Jim", content: "This game is silly. Let's do something else"},
        {name: "Hypatia", content: "Hello"},
        {name: "Brendan", content: "How are you doing today?"},
        {name: "Jim", content: "This game is silly. Let's do something else"},
        {name: "Brendan", content: "Hello"},
        {name: "Hypatia", content: "How are you doing today?"},
        {name: "Brendan", content: "This game is silly. Let's do something else"},
      ],
      sessionState: {
        players: [
          {name: 'Brendan', id: '1', color: 'blue', isFake: true},
          {name: 'Cody', id: '2', color: 'yellow', isFake: false},
          {name: 'MATUMIZURO1234', id: '3', color: 'red', isFake: false},
          {name: 'Dummy', id: '4', color: 'purple', isFake: false},
          {name: 'Brendan', id: '1', color: 'blue', isFake: true},
          {name: 'Cody', id: '2', color: 'yellow', isFake: false},
          {name: 'MATUMIZURO', id: '3', color: 'red', isFake: false},
          {name: 'Dummy', id: '4', color: 'purple', isFake: false},
        ],
        currentSessionStatus: sessionStatus
      },
      gameState: {
        playerColors: {
          1: 'red', 2: 'purple', 3: 'green', 4: 'violet'
        },
        currentPhase: gamePhase,
        isMyTurn: active,
        fakeIsMe: fake,
        secret: {
          secret: '---',
          category: 'Halloween'
        }
      }
    })
  }


  testModal(modalType) {
    if(modalType === 'BEGIN') {
      const modalContent = (
          <BeginModal 
            secret={'Halloween'}
            category={'Headless Horseman'}
          />
        )

      this.setState({
        modal: {
          isModalActive: true,
          isAbleToClose: false,
          modalContent
        }
      })  
    }
    else if (modalType === 'RESULTS') {
      const fakeWins = false;
      const fakeFound = true;
      const players = this.state.sessionState.players;
      const modalContent = (
          <ResultsModal
            fakeWins={fakeWins}
            fakeFound={fakeFound}
            players={players}
          />
        )

      this.setState({
        modal: {
          isModalActive: true,
          isAbleToClose: true,
          modalContent
        }
      });  
    }
    else if (modalType === 'GUESSAPPROVAL') {
      const modalContent = (
        <GuessApprovalModal
          secret={this.state.gameState.secret.secret}
          guess={'Poop sandwich'}
          submitGuessApproval={this.emitVoteForGuessApproval}
        />
      )

      this.setState({
        modal: {
          isModalActive: true,
          isAbleToClose: false,
          modalContent
        }
      })     
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
    else if(packet.type === 'update_player_colors') {
      this.handleUpdatePlayerColors(packet.playerColors);
    }
    else if(packet.type === 'reconnect_player') {
      this.handleReconnect(packet.payload);
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
    else if(packet.type === 'hard_reset') {
      this.handleHardReset();
    }
    else if(packet.type === 'display_secret_phase') {
      this.handleDisplaySecretPhase(packet.payload);
    }
    else if(packet.type === 'next_turn') {
      this.handleNextTurn(packet.payload);
    }
    else if(packet.type === 'initiate_fake_vote') {
      this.handleFakeVoting(packet.players);
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
    this.resetGameState(INITIAL_GAME_STATE);
    this.clearPaths();
    this.drawingboard.refresh();
  }

  handleHardReset = () => {
    this.setState({hasVotedToBegin: false});
    this.resetGameState(INITIAL_GAME_STATE);
    this.clearTimer();
    this.closeModal();
  }

  handleReconnect = newState => {
    this.setState({
      gameState: {
        ...this.state.gameState,
        currentPhase: newState.currentPhase,
        fakeIsMe: newState.isFake,
        secret: newState.secret
      }
    }) 

    //Extra State to update based on phase
    if(newState.currentPhase === DRAWING) {
      this.setState({
        gameState: {
          ...this.state.gameState,
          isMyTurn: newState.isMyTurn,
          currentPlayer: newState.currentPlayerName
        }
      })       
    }
  }
  
  handleGameOver = payload => {
    this.setState({
      gameState: {
        ...this.state.gameState,
        currentPhase: GAMEOVER
      },
      finalResults: payload,
      hasVotedToBegin: false,

    });
    //Trigger Modal
    const modalContent = (
        <ResultsModal
          fakeWins={payload.isFakeWinner}
          fakeFound={payload.isFakeFound}
          players={payload.players}
        />
      )

    this.setState({
      modal: {
        isModalActive: true,
        isAbleToClose: true,
        modalContent
      }
    })
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

    if(!this.state.gameState.fakeIsMe) {
      const modalContent = (
        <GuessApprovalModal
          secret={this.state.gameState.secret.secret}
          guess={guess}
          submitGuessApproval={this.emitVoteForGuessApproval}
        />
      )

      this.setState({
        modal: {
          isModalActive: true,
          isAbleToClose: false,
          modalContent
        }
      })
    }
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
  }

  handleFakeVoting = players => {
    this.setState({
      gameState: {
        ...this.state.gameState,
        currentPlayer: '',
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
    if(this.state.modal.isModalActive) this.closeModal();
    this.clearTimer();
    const newState = {
      currentPlayer: turn.name,
      isMyTurn: turn.active,
      currentPhase: DRAWING
    }
    this.setState({
      gameState: {
        ...this.state.gameState, 
        ...newState
      }
    })
    if(turn.active) {
      this.startCountdown(TURNLENGTH, null, () => this.handleEndOfTurn(turn.turnId))       
    }

  }

  handleEndOfTurn = turnId => {
    this.clearTimer();
    this.emitEndOfTurn(turnId);
  }

  handleDisplaySecretPhase = payload => {
    this.setState({
      gameState: {
        ...this.state.gameState, 
        secret: payload.secret,
        fakeIsMe: payload.fakeIsMe,
        currentPhase: DISPLAYSECRET
      }
    })
    const modalContent = (
        <BeginModal 
          secret={payload.secret.secret}
          category={payload.secret.category}
          isFake={payload.fakeIsMe}
        />
      )
    this.setState({
      modal: {
        isModalActive: true,
        isAbleToClose: true,
        modalContent
      }
    })
  }

  handleUpdatePlayerColors = playerColors => {
    this.setState({myColor: playerColors[this.state.myId]})
    this.setState({
      gameState: {
        ...this.state.gameState,
        playerColors
      }
    });
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
    this.drawingboard.drawPath(this.drawingboard.bgCtx, path) //Allows us to reach into the child component's functions. Dirty-boy!
  }

  //########## HELPERS ###################
  
  resetGameState = initial => {
    Object.keys(initial).forEach(key => {
      this.setState({[key]: initial[key]})
    })
  }

  savePath = path => {
    this.setState({paths: [...this.state.paths, path]})
  }

  clearPaths = () => {
    this.setState({paths: []})
  }

  closeModal = () => {
    this.setState({
      modal: INITIAL_MODAL_STATE
    })
  }

  clearTimer = () => {
    this.setState({
      timer: INITIAL_TIMER_STATE
    })
  }

  displayHelp = () => {
    this.setState({
      modal: {
        isModalActive: true,
        isAbleToClose: true,
        modalContent: <HelpModal />
      }
    })
  }


  startCountdown = (length, tickCB, endCB, isActive = true) => {
    this.setState({
      timer: {
        isActive,
        length,
        tickCB,
        endCB,
        timerId: this.generateRandomId()
      }
    });
  }

  /**
   * Players will be allowed to change their color at will outside of an active game.
   * SetColor will be passed down through the DrawingBoard to the ColorPicker component to allow 
   * it to access the top level state
   * 
   * @param  {String} color [A color string sent from ColorPicker]
   * 
   */
  setColor = color => {
    if(this.state.sessionState.currentSessionStatus !== GAMEACTIVE) {
      this.setState({myColor: color.hex})
    }
  }

  generateRandomId = (len = 8) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let length = len;
    let id = '';
    while(length--) {
      id += chars[Math.random() * chars.length | 0]
    }
    return id;
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
    this.setState({hasVotedToBegin: true});
    const packet = {
      type: 'vote_to_begin'
    }
    this.socket.emit('packet', packet);
  }

  emitVoteToReset = () => {
    if(this.state.sessionState.currentSessionStatus === GAMEACTIVE) {
      this.setState({
        gameState: {
          ...this.state.gameState,
          hasVotedToReset: !this.state.gameState.hasVotedToReset
        }
      })
      const packet = {
        type: 'vote_to_reset'
      }
      this.socket.emit('packet', packet);
    }
  }

  emitEndOfTurn = turnId => {
    // At the end set active state back to false
    const newState = {
      isMyTurn: false, 
    }
    this.setState({gameState: {...this.state.gameState, ...newState}})
    // Send message back to server socket to trigger next turn action
    const packet = {
      type: 'end_of_turn',
      turnId
    }    
    this.socket.emit('packet', packet)
  }

  emitVoteForFake = vote => {
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
    this.closeModal();
  }

  //############### LIFECYCLE AND RENDER METHODS ####################
  componentDidMount = () => {
    this.setupSocket();
    // this.testSetup(GAMEACTIVE, DRAWING, true, true) //For Testing Only
    // this.testModal('BEGIN');  //For Testing only
  }

  componentWillUnmount = () => {
    this.socket.disconnect();
  }

  ///Note: onRef is a hack to allow the parent to access the child methods
  renderDrawingboard() {
    return (
      <Drawingboard 
        playerName    = {this.state.myName}
        onRef         = {ref => (this.drawingboard = ref)}
        emitPath      = {this.emitPath}
        clientColor   = {this.state.myColor}
        clientId      = {this.state.socketId}
        isGameActive  = {this.state.sessionState.currentSessionStatus === GAMEACTIVE}
        isMyTurn      = {this.state.gameState.isMyTurn}
        paths         = {this.state.paths}
        resetHandler  = {this.emitVoteToReset}
        setColor      = {this.setColor}
        wantsReset    = {this.state.gameState.hasVotedToReset}
        displayHelp   = {this.displayHelp}
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
        playerColors={this.state.gameState.playerColors || {}}
        isVoting={this.state.gameState.currentPhase === FAKEVOTE}
        hasVoted={this.state.fakeVote.hasVoted}
        vote={this.emitVoteForFake}
        active={this.state.gameState.currentPlayer}
      />
    )
  }

  renderModal() {
    return (
      <Modal 
        isOpen={this.state.modal.isModalActive}
        onRequestClose={this.closeModal}
        className='modal'
        overlayClassName='modal-overlay'
        shouldCloseOnOverlayClick={this.state.modal.isAbleToClose}
      >
        {this.state.modal.modalContent}
      </Modal>
    )
  }

  renderStatusDisplay() {
    return (
      <StatusDisplay
        currentState              ={this.state.sessionState.currentSessionStatus}
        currentPhase              ={this.state.gameState.currentPhase}
        currentPlayer             ={this.state.gameState.currentPlayer}
        secret                    ={this.state.gameState.secret}
        fakeIsMe                  ={this.state.gameState.fakeIsMe}
        hasVotedToBegin           ={this.state.hasVotedToBegin}
        emitVoteToBegin           ={this.emitVoteToBegin}
        fakeVote                  ={this.state.fakeVote}
        emitVoteForFake           ={this.emitVoteForFake}
        emitVoteForGuessApproval  ={this.emitVoteForGuessApproval}
        emitGuess                 ={this.emitGuess}
        hasGuessed                ={this.state.fakeGuess.hasGuessed}
        guessApproval             ={this.state.guessApproval}
      />
    )
  }

  renderTimer() {
    if(this.state.timer.isActive) {
      return (
        <div className="timer-container">
          <Timer
            length  = {this.state.timer.length}
            tickCB  = {this.state.timer.tickCB}
            endCB   = {this.state.timer.endCB}
          />
        </div>
      )
    }
    else {
      return (
        <div className="timer-container" />
      )
    }
  }

  render() {
    const setBGColor = () => {
      if(this.state.sessionState.currentSessionStatus === GAMEACTIVE) {
        if(this.state.gameState.isMyTurn) {
          return BG_GAME_MYTURN;
        }
        else {
          return BG_GAME_NOTMYTURN;
        }
      }
      else {
        return BG_NOGAME;
      }
    }

    return (
      <div id="room-container" className={setBGColor()}>
        <div className="upper-container">
          {this.renderActivePlayerScreen()}
        </div>
        <div className="lower-container">
          <div className="lower-left">
            <div id="canvas-container">
              {this.renderDrawingboard()}
              {this.renderStatusDisplay()}
              {this.renderTimer()}
            </div>
          </div>
          <div className="lower-right">
            <div id="sidebar-container">
              {this.renderChatroom()}
            </div>        
          </div>
        </div>
        {this.renderModal()}
      </div>
    );      
  }
}

export default App;
