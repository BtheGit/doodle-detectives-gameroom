import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ColorPicker from './ColorPicker';


class Drawingboard extends Component {
	constructor(props) {
		super(props);

		this.ref = null;
		this.canvas = null;
		this.ctx = null;

		this.bgRef = null;
		this.bgCanvas = null;
		this.bgCtx = null;

		this.state = {
			isDrawing: false,
			startX: 0,
			startY: 0,
		}
	}

	buildPath = (x, y) => {
		return {
			name: this.props.playerName,
			id: this.props.clientId,
			color: this.props.clientColor,
			startX: this.state.startX,
			startY: this.state.startY,
			endX: x,
			endY: y
		}
		
	}

	sendPath = path => {
		this.props.emitPath(path);
	}

	drawPath = (ctx, path, local = false) => {
		ctx.strokeStyle = path.color;
		ctx.beginPath();
		ctx.moveTo(path.startX, path.startY);
		ctx.lineTo(path.endX, path.endY);
		ctx.stroke();

		//This keeps the cursor in the right place when the local client is drawing
		if(local) {
		// if(path.id === this.props.clientId) {
			this.setState({
				startX: path.endX,
				startY: path.endY
			});
		}
	}

	//Redraw from array to Background canvas
	drawPaths = () => {
		this.props.paths.forEach(path => {
			this.drawPath(this.bgCtx, path)
		});
	}

	cls = (canvas, ctx) => {
		ctx.clearRect(0,0, canvas.width, canvas.height);
	}

	refresh = () => {
		this.cls(this.canvas, this.ctx);
		this.cls(this.bgCanvas, this.bgCtx);
		this.drawPaths();
	}

	saveImage = () => {
		const downloadButton = document.getElementById('save-canvas')
		this.refresh();
		const data = this.bgCanvas.toDataURL("image/png");
		const downloadData = data.replace('image/png', 'image/octet-stream')
		downloadButton.href = downloadData;
	}

	//############## LIFECYCLE & RENDER METHODS ###########

	changeResolution(canvas, context, scaleFactor) {
    // Set up CSS size if it's not set up already
    if (!canvas.style.width)
        canvas.style.width = canvas.width + 'px';
    if (!canvas.style.height)
        canvas.style.height = canvas.height + 'px';

    canvas.width = Math.ceil(canvas.width * scaleFactor);
    canvas.height = Math.ceil(canvas.height * scaleFactor);
    context.scale(scaleFactor, scaleFactor);
	}

	createCanvas = (ref) => {
		let newCanvas = ref;
		let newCtx = newCanvas.getContext('2d');
		newCanvas.width = 700 //600; //1000
		newCanvas.height = 396 //339; //565
		this.changeResolution(newCanvas, newCtx, 3);
		newCtx.strokeStyle = '#BADA55';
		newCtx.lineJoin = 'round';
		newCtx.lineCap = 'round';
		newCtx.lineWidth = 2;

		return {canvas: newCanvas, ctx: newCtx}
	}

	setupListeners = canvas => {
		canvas.addEventListener('mousedown', (event) => {
			this.setState({
				isDrawing: true,
				startX: event.offsetX,
				startY: event.offsetY
			});
		})
		canvas.addEventListener('mouseup', () => this.setState({isDrawing: false}))
		canvas.addEventListener('mouseout', () => this.setState({isDrawing: false}))
		canvas.addEventListener('mousemove', (event) => {
			//Only Draw and Emit paths if a) the game is not in session or b) it's in the drawing phase and it's your turn
			if(this.props.isGameActive && !this.props.isMyTurn) {
				return;
			} else {
				if(this.state.isDrawing) {
					const path = this.buildPath(event.offsetX, event.offsetY)
					this.sendPath(path)
					this.drawPath(this.ctx, path, true);
				}
			}
		})
		// window.addEventListener("resize", this.handleWindowResize, false);		
	}

	componentDidMount = () => {
		this.props.onRef(this) //To allow Parent to access child methods

		//Set up canvas that local client will draw too
		const fgCanvas = this.createCanvas(this.ref);
		this.canvas = fgCanvas.canvas;
		this.ctx = fgCanvas.ctx;

		//Remote paths and redraws will render here
		const bgCanvas = this.createCanvas(this.bgRef);
		this.bgCanvas = bgCanvas.canvas;
		this.bgCtx = bgCanvas.ctx;

		//Listeners are attached to the client canvas natch
		this.setupListeners(this.canvas);

		//Restore canvas state to match current universal session state;
		this.drawPaths()
	}

	componentWillUnmount = () => {
		//TODO remove event listeners
	}

	render() {
		return (
			<div style={{height: '100%', width: '100%'}}>
				<div className="manila-folder"></div>
				<div className="paper"></div>
				<div className="paper"></div>
				<div className="paper"></div>
				<canvas ref={(ref) => {this.bgRef = ref}} id="bgCanvas" />
				<canvas ref={(ref) => {this.ref = ref}} id="drawingCanvas" />
				<div className="tab-container">
					<div className="tab-select tab-save">
						<a id="save-canvas" onClick={this.saveImage} download="doodle.png"></a>
					</div>
					<div 
						className={`tab-select tab-reset ${this.props.isGameActive ? '' : 'hidden'}`} 
						onClick={this.props.resetHandler}
					>
						&#xf05e;
					</div>
					<div 
						style={{background: `${this.props.clientColor}`}}
						className={`tab-select tab-colorpicker ${this.props.isGameActive ? 'hidden' : ''}`}
					
					>
						<ColorPicker 
							color 		= {this.props.clientColor}
							setColor 	= {this.props.setColor}
						/>
					</div>
				</div>
			</div>
		)
	}
}

Drawingboard.propTypes = {
  playerName:PropTypes.string.isRequired,
  onRef: PropTypes.func.isRequired,
  emitPath: PropTypes.func.isRequired,
  clientColor: PropTypes.string.isRequired,
  clientId: PropTypes.string.isRequired,
  isGameActive: PropTypes.bool.isRequired,
  isMyTurn: PropTypes.bool.isRequired,
  paths: PropTypes.array.isRequired
};

export default Drawingboard;