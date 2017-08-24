import React, { Component } from 'react';
import Spinner from './Spinner';
import img1 from '../images/splash_frame_color.png';
import img2 from '../images/fake.png';
import img3 from '../images/man.png';
import img4 from '../images/detective.png';
import img5 from '../images/fake_wins_found.jpg';
import img6 from '../images/fake_wins_notfound.jpg';
import img7 from '../images/detectives_win.jpg';
import img8 from '../images/fakei.png';
import img9 from '../images/detectivei.png';
import img10 from '../images/splatter.png';

let imageAssets = [img1, img2, img3, img4, img5, img6, img7, img8, img9, img10];

class AssetLoader extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      assetMap: this.createAssetMap(imageAssets)
    }
  }

  /**
   * This creates DOM elements without appending them to the DOM. 
   * It's a way of ensuring that the Client requests/preloads all the
   * assets as soon as they enter the room.
   * 
   * @param  {Array<String>} assets 
   * @return {Array<DOM Nodes>}
   */
  createAssetMap = assets => {
    return assets.map(url => {
      const img = new Image();
      img.src = `${url}`;
      return img;
    })    
  }

  componentDidMount() {
    this.setState({isLoading: false})
  }

  render() {
    const style = {
      height: '100%',
      width: '100%',
      margin: '0',
      padding: '0'
    }
    return !this.state.isLoading 
              ? (
                <div style={style}>
                  {this.props.children}
                </div>
              )
              : <Spinner />
  }
}

export default AssetLoader;