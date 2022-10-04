import { spawnSync } from 'child_process';
import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { writeFileSync } from 'fs';
// import { mkdirSync, writeFileSync } from 'fs';
import path, { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Channels, RunWhisperResponse } from '../../channels';
import { entry, entryTranscription, transcriptionStatus } from '../../types';
import { WhisperArgs } from '../../whisperTypes';

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
    console.log('args: ', args);

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

    // Synchronously run the script
    // TODO: #48 Make this async
    const out = spawnSync('whisper', passedArgs);

    console.log('finished running whisper script');
    console.log('out: ', out);

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

    // const out = spawn('whisper', ['--model', 'tiny.en', '--output_dir', outputDir, inputPath]); // FIXME: Use model args

    // Log the output
    console.log('stdout: ', out.stdout.toString());
    console.log('stderr: ', out.stderr.toString());

    // Return the output
    out.output.forEach((output) => {
      if (output) {
        console.log('output: ', output.toString());
      }
    });
    return {
      transcription_uuid: uuid,
      outputDir: outputDir,
      entry: entry
    };
    // out.stdout.on('data', (data) => {
    //   console.log(`stdout: ${data}`);
    // });
    // out.stderr.on('data', (err) => {
    //   console.log(`stderr: ${err}`);
    // });
    // out.on('message', (message) => {
    //   console.log(`message: ${message}`);
    // });

    //   out.on('close', (code) => {
    //     console.log(`child process exited with code ${code}`); // TODO: #49 Handle the output of the script

    //     if (code === 0) {
    //       console.log('Whisper script ran successfully');

    //       return {
    //         transcription_uuid: uuid,
    //         outputDir: outputDir,
    //         entry: entry
    //       };
    //     } else {
    //       throw new Error('Whisper script failed');
    //     }
    //   });
    // }
  }
);
