/**
 * @format
 */

import { AppRegistry } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import { name as appName } from './app.json';
import { PlaybackService } from './src/services/trackplayer';

AppRegistry.registerComponent(appName, () => App);

// Register the background playback service — this runs even when the app is killed
TrackPlayer.registerPlaybackService(() => PlaybackService);
