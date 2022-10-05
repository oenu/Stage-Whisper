// import { ipcMain, IpcMainInvokeEvent, BrowserWindow } from 'electron';
// import { audioPlaybackResponse, Channels } from '../../types/channels';

// /**
//  * Audio Playback Args
//  * @type AudioPlaybackArgs
//  * Passed to main function to control audio playback in a hidden window
//  * @param {string} filePath - Path to the audio file
//  * @param {string} action - Action to perform on the audio file
//  * @param {number} [volume] - Volume to set the audio file to
//  * @param {number} [seek] - Seek to a specific time in the audio file
//  * @param {number} [speed] - Speed to set the audio file to
//  */
// export type audioPlaybackArgs = {
//   filePath: string;
//   action: 'play' | 'pause' | 'stop' | 'setVolume' | 'seek' | 'setSpeed' | 'seekAndPlay';
//   volume?: number;
//   seek?: number;
//   speed?: number;
// };

// /**
//  * Control audio playback
//  * @param {audioPlaybackArgs} args - Arguments to control audio playback
//  * @returns {Promise<void>} - Promise that resolves when the audio operation has been passed to the playback window
//  * @example
//  * // Play audio
//  * await ipcRenderer.invoke(Channels.audioPlayback, {
//  *  filePath: 'path/to/audio/file',
//  * action: 'play'
//  * });
//  */
// export default ipcMain.handle(
//   Channels.audioPlayback,
//   async (_event: IpcMainInvokeEvent, args: audioPlaybackArgs): Promise<audioPlaybackResponse> => {
//     // Get the playback window
//     const playback = BrowserWindow.getAllWindows().filter((window) => window.getTitle() === 'Playback')[0];

//     // Send the audio playback command to the playback window
//     playback.webContents.send(Channels.audioPlayback, args);

//     switch (args.action) {
//       case 'play':
//         audio.play();
//         break;
//       case 'seekAndPlay':
//         if (args.seek) {
//           audio.currentTime = args.seek;
//           audio.play();
//         } else {
//           throw new Error('SeekAndPlay action requires a seek argument');
//         }
//         break;
//       case 'pause':
//         audio.pause();
//         break;
//       case 'stop':
//         audio.pause();
//         audio.currentTime = 0;
//         break;
//       case 'setVolume':
//         if (args.volume) audio.volume = args.volume;
//         break;
//       case 'seek':
//         if (args.seek) audio.currentTime = args.seek;
//         break;
//       case 'setSpeed':
//         if (args.speed) audio.playbackRate = args.speed;
//         break;
//       default:
//         break;
//     }
//   }
// );
