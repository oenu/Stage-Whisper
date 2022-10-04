// Electron
import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { writeFileSync } from 'fs';
import { join } from 'path';

// Packages
import { v4 as uuidv4 } from 'uuid';

// Types
import { Channels, RunWhisperResponse } from '../../types/channels';
import { WhisperArgs } from '../../types/whisperTypes';
import { entry, entryTranscription, transcriptionStatus } from '../../types/types';

// Node
import { spawn } from 'child_process';

export default ipcMain.handle(
  Channels.runWhisper,
  async (_event: IpcMainInvokeEvent, args: WhisperArgs, entry: entry): Promise<RunWhisperResponse> => {
    const { inputPath } = args;
    let { model, language, device, task } = args;

    // Set Defaults
    // Default to Base multilingual model
    if (!model) model = 'base';

    // If no language is specified, use the language of the audio file, if it is not specified, use English
    if (!language) {
      if (entry.audio.language) language = entry.audio.language;
      else language = 'English';
    }

    // If no device is specified, use the cpu
    if (!device) device = 'cpu';

    // If no task is specified, check if the audio file's language is English, if it is, use transcribe, if not, use translate
    if (!task) {
      if (language === 'English') task = 'transcribe';
      else task = 'translate';
    }

    // If no input path is specified, throw
    if (!inputPath) {
      throw new Error('No input path provided');
    }

    // Generate UUID for the entry
    const uuid = uuidv4();

    const transcribedOn = new Date();

    // Generate output path
    const outputDir = join(entry.path, 'transcriptions', uuid);
    console.log('RunWhisper: outputDir', outputDir);

    // Run Whisper
    console.log('Running whisper script');

    const passedArgs = [
      '--output_dir',
      `${outputDir}`,
      '--model',
      `${model}`,
      `--task`,
      `${task}`,
      '--device',
      `${device}`,
      '--language',
      `${entry.audio.language}`,
      `${inputPath}`
    ];

    console.log('RunWhisper: Running model with args', passedArgs);

    // Synchronously run the script
    // TODO: #48 Make this async
    const out = spawn('whisper', passedArgs);

    out.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    out.stderr.on('data', (err) => {
      console.log(`stderr: ${err}`);
    });
    out.on('message', (message) => {
      console.log(`message: ${message}`);
    });

    // Handle End of Script
    out.on('close', async (code) => {
      console.log('finished running whisper script');
      console.log(`Whisper process exited with code ${code}`);
      if (code === 0) {
        // Create a new entry transcription

        // Collect transcription parameters
        const parameters: entryTranscription = {
          uuid,
          transcribedOn,
          completedOn: new Date(),
          model, // Model used to transcribe
          language, // Language of the audio file
          status: transcriptionStatus.COMPLETE, // Status of the transcription
          progress: 100, // Progress of the transcription
          translated: task === 'translate', // If the transcription was translated
          error: undefined, // Error message
          path: outputDir // Path to the transcription folder
        };

        // Create a transcription.json file
        console.log('Creating transcription.json file');
        writeFileSync(join(outputDir, 'transcription.json'), JSON.stringify(parameters));
        console.log('Created transcription.json file');
        // Return the parameters
      } else {
        console.log('Whisper script failed');
      }

      //console.log(`child process exited with code ${code}`); // TODO: #49 Handle the output of the script
    });
  }
);
