import React, { Component } from 'react';
import './styles/App.css';
import io from 'socket.io-client';
import Modal from 'react-modal';
import Timer from './components/Timer.js'
import Chatroom from './components/Chatroom.js';
import Drawingboard from './components/Drawingboard.js';
import StatusDisplay from './components/StatusDisplay.js';
import GuessApprovalForm from './components/GuessApprovalForm.js';
import ActivePlayerScreen from './components/ActivePlayerScreen.js';


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

class App extends Component {
  constructor(props) {
    super(props);
    this.socket = null;
    this.background = document.getElementById('canvas-container');
    this.state = {
      isLoading: true,
      socketId: '',
      myId: '', //TEMP until auth and persistent login (necessary for self-identifying in state updates)
      myName: '',
      myColor: 'black',
      //If coming from newroom route, no id will be provided, default to empty string
      sessionId: '', 
      score: 0,
      chatMessages: [
        // {name: "Brendan", content: "Hello"},
        // {name: "Jim", content: "How are you doing today?"},
        // {name: "Brendan", content: "This game is silly. Let's do something else"},
        // {name: "Hypatia", content: "Hello"},
        // {name: "Brendan", content: "How are you doing today?"},
        // {name: "Jim", content: "This game is silly. Let's do something else"},
        // {name: "Hypatia", content: "Hello"},
        // {name: "Brendan", content: "How are you doing today?"},
        // {name: "Jim", content: "This game is silly. Let's do something else"},
        // {name: "Brendan", content: "Hello"},
        // {name: "Hypatia", content: "How are you doing today?"},
        // {name: "Brendan", content: "This game is silly. Let's do something else"},
      ],
      paths: [],
      hasVotedToBegin: false, //Used for conditionally rendering status display after voting
      modal: {
        isModalActive: false,
        isAbleToClose: true,
        modalContent: ''
      },
      sessionState: {
        players: [
          // {name: 'Brendan', id: '1', color: 'blue', isFake: true},
          // {name: 'Cody', id: '2', color: 'yellow', isFake: false},
          // {name: 'MATUMIZURO1234', id: '3', color: 'red', isFake: false},
          // {name: 'Dummy', id: '4', color: 'purple', isFake: false},
          // {name: 'Brendan', id: '1', color: 'blue', isFake: true},
          // {name: 'Cody', id: '2', color: 'yellow', isFake: false},
          // {name: 'MATUMIZURO', id: '3', color: 'red', isFake: false},
          // {name: 'Dummy', id: '4', color: 'purple', isFake: false},
        ],
        currentSessionStatus: '', //[WAITINGFORPLAYERS, WAITINGTOSTART, GAMEACTIVE]
      },
      gameState: {
        playerColors: {
          // 1: 'red', 2: 'purple', 3: 'green', 4: 'violet'
        },
        currentPhase: '', 
        currentColor: '',
        currentPlayer: '',
        isMyTurn: false,
        fakeIsMe: false,
        secret: {
          category: '',
          secret: ''
          // category: 'Animals',
          // secret: 'Headless Horseman'
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
      },
      timer: {
        isActive: false,
        length: 0,
        tickCB: null,
        endCB: null
      },
      statusMessage: ''
    }
  }

  //##########  TEMP - for Modal testing


  // testModal() {
  //   const isFake = this.state.gameState.fakeIsMe;
  //   const modalContent = (
  //     <div className="modal-content modal-begin">
  //       <div className="modal-header">Get Ready to Doodle!</div>
  //       <div className={`modal-image ${isFake ? 'fake' : null}`}></div>
  //       <div className="modal-category"><span>Category:</span> Fluids</div>
  //       <div className="modal-secret"><span>Secret:</span> Poop</div>
  //     </div>
  //   )

  //   this.setState({
  //     modal: {
  //       isModalActive: true,
  //       isAbleToClose: true,
  //       modalContent
  //     }
  //   })  
  // }

  // testModal() {
  //   const fakeWins = false;
  //   const fakeFound = true;
  //   const players = this.state.sessionState.players;
  //   const modalContent = this.styleResultsModal(fakeWins, fakeFound, players);


  //   this.setState({
  //     modal: {
  //       isModalActive: true,
  //       isAbleToClose: true,
  //       modalContent
  //     }
  //   });  
  // };

  testModal() {
    const modalContent = (
      <GuessApprovalForm
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
 
  };

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
    const modalContent = this.styleResultsModal(payload.isFakeWinner, payload.isFakeFound, payload.players);
    this.setState({
      modal: {
        isModalActive: true,
        isAbleToClose: true,
        modalContent
      }
    })
  }


  styleResultsModal(fakeWins, fakeFound, players) {
    function results(fakeWins, fakeFound) {
      if(fakeWins) {
        if(fakeFound) {
          return {
            header: 'Fake Wins!',
            text: 'was uncovered but guessed the secret correctly to steal the win.',
            class: 'fake-wins-found'
          }
        }
        else {
          return {
            header: 'Fake Wins!',
            text: 'was never identified. A sound defeat for the art of deduction.',
            class: 'fake-wins-notfound'
          }
        }
      }
      else {
        return {
          header: 'Detectives Win!',
          text: 'was found and failed to discover the secret. A great victory for the forces of deduction!',
          class: 'detectives-win'
        }
      }
    }

    function fakeReveal(players) {
      players = players.filter(player => player.isFake);
      const fake = players[0];
      const divStyle = {
          color: fake.color,
      };
      return fake;

    }

    function displayPlayers(players) {
      //Dynamically show players in their respective color, with fake bolded
      return players.map((player, idx) => {
        //available properties: {color, name, isFake}
        const divStyle = {
          color: player.color,
        };
        const classNameCon = `modal-result-players player`;

        return (
          <div className={classNameCon}>
            <div style={divStyle} key={idx}>{player.name}</div>
          </div>
        )
      })
    }

    const res = results(fakeWins, fakeFound)
    const fake = fakeReveal(players)
    const divStyle = {
        color: fake.color,
    };
    const modalContent = (
      <div className="modal-content modal-results">
        <div className={`top-half ${res.class}`}>
          <div className="modal-header">{res.header}</div>
        </div>
        <div className="bottom-half">
          <div className="modal-results-text"><span style={divStyle}>{`${fake.name} `}</span>{`${res.text}`}</div>
        </div>
        <div className={`center-image ${fakeWins?'mood-sad':'mood-happy'}`}></div>
      </div>
    )

    return modalContent;
  }

  styleBeginModal({secret, category}) {
    const isFake = this.state.gameState.fakeIsMe;
    const modalContent = (
      <div className="modal-content modal-begin">
        <div className="modal-header">Get Ready to Doodle!</div>
        <div className={`modal-image ${isFake ? 'fake' : null}`}></div>
        <div className="modal-category"><span>Category:</span> {category}</div>
        <div className="modal-secret"><span>Secret:</span> {secret}</div>
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

    if(!this.state.gameState.fakeIsMe) {
      const modalContent = (
        <GuessApprovalForm
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
      const newState = {
        currentColor: turn.color,
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
        this.startCountdown(TURNLENGTH, null, this.handleEndOfTurn)       
      }
  }

  handleEndOfTurn = () => {
    this.setState({
      timer: {
        isActive: false,
        length: 0,
        tickCB: null,
        endCB: null,
      }
    });
    this.emitEndOfTurn();
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
    this.startCountdown(payload.displayLength, null, this.startFirstTurn)
    const modalContent = this.styleBeginModal(payload.secret);
    this.setState({
      modal: {
        isModalActive: true,
        isAbleToClose: false,
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

  postStatusMessage = statusMessage => {
    console.log('Status Message:', statusMessage)
    // this.setState({statusMessage})
    this.statusMessage = statusMessage;
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

  //######## HELPERS

  closeModal = () => {
    this.setState({
      modal: {
        isModalActive: false,
        isAbleToClose: true,
        modalContent: ''       
      }
    })
  }

  startFirstTurn = () => {
    this.closeModal();
    this.setState({
      timer: {
        isActive: false,
        length: 0,
        tickCB: null,
        endCB: null,
      }
    });
  }

  startCountdown = (length, tickCB, endCB, isActive = true) => {
    this.setState({
      timer: {
        isActive,
        length,
        tickCB,
        endCB
      }
    });
  }

  //############### LIFECYCLE AND RENDER METHODS ####################
  componentDidMount = () => {
    this.setupSocket();
    this.setState({isLoading: false});
    // this.testModal();  //For Testing only
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
        currentColor              ={this.state.gameState.currentColor}
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
        postStatusMessage         ={this.postStatusMessage}
        statusMessage             ={this.statusMessage}
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

    if(this.state.isLoading) {
      return (
        <div className="loading-bg">
          <div id="loading-spinner">
            <div className="spin-element spinner1"></div>
            <div className="spin-element spinner2"></div>
          </div>
        </div>
      )
    }
    else {
      return (
        <div id="room-container" className={setBGColor()}>
          <div id="preload"></div>
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
}

export default App;
