import { whisperLanguages } from './../../types/whisperTypes';
// Electron
import { app, ipcMain, IpcMainInvokeEvent } from 'electron';
import { join } from 'path';

// Packages
import { spawn } from 'child_process';
import { existsSync, mkdirSync, readFileSync } from 'fs';
import { NodeCue, parseSync } from 'subtitle';
import { v4 as uuidv4 } from 'uuid';
import { getAudioDurationInSeconds } from 'get-audio-duration';

// Types
import { Entry, Line, Transcription } from 'knex/types/tables';
import db, { transcriptionStatus } from '../../database/database';
import { Channels } from '../../types/channels';
import { WhisperArgs } from '../../types/whisperTypes';

export type RunWhisperResponse = {
  transcription: Transcription;
  entry: Entry;
};

export type parserResult = {
  // System
  fp16?: boolean; // Whether fp16 is supported on the CPU

  // Language
  detecting_language?: boolean; // Whether the model is currently detecting the language
  language?: keyof typeof whisperLanguages; // Language detected by whisper
  task?: 'translate' | 'transcribe'; // Whether the model is translating or transcribing

  // Transcription
  start?: number; // Start time of the current subtitle line (milliseconds)
  end?: number; // End time of the current subtitle line (milliseconds)
  progress?: number; // Progress of the current task
  text?: string; // Text of the current subtitle line

  // Estimates
  time_remaining?: number; // Estimated time remaining for the current transcription
  time_elapsed?: number; // Time elapsed for the current transcription
  time_total?: number; // Estimated time to complete the entire transcription
};

export const whisperParser = (line: string, transcribedOn: number, audio_file_length?: number): parserResult | void => {
  try {
    // Check if the line contains "Detecting language using up to the first 30 seconds."
    if (line.includes('Detecting language using up to the first 30 seconds.')) {
      return { detecting_language: true };
    }

    // Check if the line contains "Detected language: "
    if (line.includes('Detected language: ')) {
      // If so, return the language

      // Get the language from the line
      const language = line.split('Detected language: ')[1];

      // Check if language is english (this will have to change if whisper supports translating into other languages)
      if (language === 'English') {
        return {
          language: 'English',
          detecting_language: false,
          progress: 1,
          task: 'transcribe'
        };
      } else if (language) {
        // Check if the language is supported
        if (Object.keys(whisperLanguages).includes(language)) {
          // Detected a supported language
          return {
            language: language as keyof typeof whisperLanguages,
            detecting_language: false,
            progress: 0,
            task: 'translate'
          };
        } else {
          // Detected an unsupported language
          return {
            detecting_language: false,
            progress: 0
          };
        }
      } else {
        // No language detected
        return {
          detecting_language: false,
          progress: 0
        };
      }
    }

    // Check if fp16 computation is enabled for this cpu
    if (line.includes('FP16 is not supported on CPU')) {
      return { fp16: false };
    }

    // Check if line contains a start and end time ([00:00.000 --> 00:06.140]  Example subtitle line)
    if (line.includes(' --> ')) {
      // Get the start and end time from the line
      const times = line.split(' --> ');

      // Get the start time in milliseconds
      const startMins = times[0].split(':')[0].replace('[', '');
      const startSeconds = times[0].split(':')[1].split('.')[0];
      const startMilliseconds = times[0].split('.')[1].slice(0, 3);
      const start = parseInt(startMins) * 60 * 1000 + parseInt(startSeconds) * 1000 + parseInt(startMilliseconds);

      // Get the end time in milliseconds
      const endMins = times[1].split(':')[0];
      const endSeconds = times[1].split(':')[1].split('.')[0];
      const endMilliseconds = times[1].split('.')[1].slice(0, 3);
      const end = parseInt(endMins) * 60 * 1000 + parseInt(endSeconds) * 1000 + parseInt(endMilliseconds);

      // Get the text from the line
      const text = line.split(']  ')[1];

      // Calculate the progress of the current task
      if (audio_file_length) {
        const progress = end / 1000 / audio_file_length;
        const progressRounded = Math.round(progress * 100) / 100;

        // Estimate the time remaining for the current task
        const started = new Date(transcribedOn);
        const now = new Date();

        // Time elapsed for the current task
        const timeElapsed = now.getTime() - started.getTime();
        const timeElapsedSeconds = Math.round(timeElapsed / 1000);

        // Total time for the current task
        const timeTotal = timeElapsed / progress;
        const timeTotalSeconds = Math.round(timeTotal / 1000);

        // Time remaining for the current task
        const timeRemaining = timeElapsed / progress - timeElapsed;
        const timeRemainingSeconds = Math.round(timeRemaining / 1000);

        return {
          start,
          end,
          text,
          progress: Math.min(progressRounded, 1),
          time_remaining: Math.max(timeRemainingSeconds, 0),
          time_elapsed: timeElapsedSeconds,
          time_total: timeTotalSeconds
        };
      } else {
        return { start, end, text };
      }
    }
    return;
  } catch (error) {
    console.log('Error in parser: ', error); // Extra logging for debugging
    return;
  }
};

export default ipcMain.handle(
  Channels.runWhisper,
  async (_event: IpcMainInvokeEvent, args: WhisperArgs, entry: Entry): Promise<RunWhisperResponse> => {
    const { inputPath } = args;
    let { model, device, task, language } = args;
    let progress = 0;

    // Paths
    const rootPath = app.getPath('userData'); // Path to the top level of the data folder
    const storePath = join(rootPath, 'store'); // Path to the store folder
    const whisperPath = join(storePath, 'whisper'); // Path to the whisper folder

    // Check if whisper path exists - if not, create it
    try {
      existsSync(whisperPath);
    } catch (error) {
      mkdirSync(whisperPath);
    }

    // Output will be stored in "./store/whisper/{transcription_uuid}/" as an .srt, .vtt, .txt and .json file
    // ------------------  Set defaults for the whisper model ------------------ //

    if (!model) model = 'base'; // Default to Base multilingual model

    if (!device) device = 'cpu'; // If no device is specified, use the cpu

    if (language !== 'Unknown') {
      // If the language is unknown, let whisper decide which task to use
      if (!task) {
        // If no task is specified, check if the audio file's language is English
        // If = english, use transcribe, if not, use translate
        if (language === 'English') task = 'transcribe';
        else task = 'translate';
      }
    }

    if (!inputPath) {
      // If no input path is specified, throw -- This should never happen
      throw new Error('No input path provided');
    }

    // Check if the input file exists
    try {
      existsSync(inputPath);
    } catch (error) {
      throw new Error('Input file does not exist');
    }

    // Get the duration of the audio file
    const audio_file_length = await getAudioDurationInSeconds(inputPath);
    console.log('Audio file length: ', audio_file_length);

    const uuid = uuidv4(); // Generate UUID for the transcription

    const transcribedOn = new Date().getTime(); // Get the current date and time for when the transcription was started

    // Generate output path
    const outputDir = join(whisperPath, uuid);
    console.log('RunWhisper: outputDir', outputDir);

    // ------------------  Construct the input array for the whisper script ------------------ //
    const inputArray = []; // Array to hold the input arguments for the whisper script

    inputArray.push('--output_dir', outputDir); // Add the output directory

    // If the task is transcribe, add the transcribe flag
    if (task === 'transcribe') inputArray.push('--task', 'transcribe');
    // If the task is translate, add the translate flag
    else if (task === 'translate') inputArray.push('--task', 'translate');

    // If the language is defined, add the language flag
    if (language && language !== 'Unknown') inputArray.push('--language', language);

    // If the model is defined, add the model flag
    if (model) inputArray.push('--model', model);

    // If the device is defined, add the device flag
    if (device) inputArray.push('--device', device);

    inputArray.push('--verbose', 'True'); // Add the verbose flag

    // Add the input path
    inputArray.push(inputPath);

    // ---------------------------------  Run the whisper script --------------------------------- //

    console.log('RunWhisper: Running model with args', inputArray);

    // New Process env object to pass to the child process
    const env = {
      ...process.env,
      PYTHONUNBUFFERED: '1'
    };

    // Spawn the whisper script
    const childProcess = spawn('whisper', inputArray, { stdio: 'pipe', env: env });

    // ---------------------------------  Child Process Data Listener --------------------------------- //

    childProcess.stdout?.addListener('data', (data) => {
      // Get the data from the child process

      // Convert the data to a string
      const dataString = data.toString();

      // Split the data into lines
      const lines = dataString.split('\n' || '\r');

      // Loop through the lines
      lines.forEach((line: string) => {
        if (typeof line === 'string') {
          // Check if the line is a string
          const parsed = whisperParser(line, transcribedOn, audio_file_length);
          if (parsed) {
            // If the script detected a language, update the language variable
            if (parsed.language) {
              console.log(`Detected language: ${parsed.language}, will add to transcription record`);
              language = parsed.language;
            }

            // If the script detected a task, update the task variable
            if (parsed.task) {
              console.log(`Detected task: ${parsed.task}, will add to transcription record`);
              task = parsed.task;
            }

            // If the script detected a progress, update the progress variable
            if (parsed.progress) {
              progress = parsed.progress;
              console.log(`Detected progress: ${progress}`);
            }
          }
        }
      });
    });

    // ---------------------------------  Child Process Error Listener  --------------------------------- //
    childProcess.stderr?.addListener('data', (data) => {
      console.log('Error from child: ', data.toString());
    });

    const transcription = await new Promise<Transcription>((resolve, reject) => {
      // ------------------  Listen for the child process to exit and generate a transcription.json file ------------------ //
      childProcess.on('close', async (code: number) => {
        console.log(`RunWhisper: Child process closed with code ${code}`);
        if (code === 0) {
          // ------------------  Convert the VTT file to Json ------------------ //
          const vttPath = join(outputDir, `${entry.audio_name}.vtt`);
          console.log('RunWhisper: Converting VTT to JSON...');
          console.log('RunWhisper: vttPath', vttPath);

          // Check that the VTT file exists
          try {
            existsSync(vttPath);
          } catch (error) {
            console.log('RunWhisper: Error checking if VTT file exists', error);
            throw new Error('Error checking if VTT file exists');
          }

          // Read the VTT file
          let vttFile;
          try {
            vttFile = readFileSync(vttPath, 'utf8');
            console.log('RunWhisper: VTT file read successfully.');
          } catch (error) {
            console.log('RunWhisper: Error reading VTT file!', error);
            throw new Error('Error reading VTT file!');
          }

          // Split the VTT file into an array of lines
          console.log('RunWhisper: Parsing VTT file...');
          const lines = parseSync(vttFile);

          // Check if the VTT file is empty
          if (lines.length === 0) {
            console.log('RunWhisper: VTT file is empty!');
            throw new Error('VTT file is empty!');
          }

          // Remove header lines from the VTT file
          console.log('RunWhisper: Removing header lines from VTT file...');
          const cues = lines.filter((line) => line.type === 'cue') as NodeCue[];

          // Add to the database
          console.log('RunWhisper: Building transcription object...');
          const transcription: Transcription = {
            uuid,
            entry: entry.uuid,
            transcribedOn,
            path: outputDir,
            model,
            language,
            status: transcriptionStatus.COMPLETE,
            progress: 1,
            completedOn: new Date().getTime(),
            error: undefined,
            translated: task === 'translate'
          };

          // Add the transcription to the database

          // invoke the main process to add the transcription to the database
          console.log('RunWhisper: Adding transcription to database...');
          console;
          const newTranscription = (
            (await db('transcriptions').insert(transcription).returning('*')) as Transcription[]
          )[0];

          if (newTranscription.error) {
            console.log('RunWhisper: Error adding transcription to database!', newTranscription.error);
            throw new Error('Error adding transcription to database!');
          }

          // Convert cues to Lines objects
          console.log('RunWhisper: Converting cues to lines...');
          const formattedLines: Line[] = cues.map((cue, index) => {
            const line: Line = {
              uuid: uuidv4(),
              entry: entry.uuid,
              transcription: newTranscription.uuid,
              start: cue.data.start,
              end: cue.data.end,
              text: cue.data.text || '',
              index, // Note! This assumes that the cues are in order from whisper
              deleted: false,
              version: 0
            };
            return line;
          });

          // Add the lines to the database
          console.log('RunWhisper: Adding lines to database...');
          const newLines = (await db('lines').insert(formattedLines).returning('*')) as Line[];

          if (newLines.length !== formattedLines.length) {
            console.warn(
              'RunWhisper: Mismatch between number of lines added to database and number of lines generated!'
            );
            console.log('RunWhisper: Error adding lines to database!', newLines);
            throw new Error('Mismatch between number of lines added to database and number of lines generated!');
          } else {
            console.log('RunWhisper: Lines added to database successfully!');
          }

          // ------------------  Delete the VTT file ------------------ //
          // Not deleting the VTT file for now, as it's useful for debugging

          // ------------------  Resolve the promise ------------------ //
          console.debug('RunWhisper: Resolving promise...');
          console.debug(transcription);
          resolve(transcription);
        } else {
          // ------------------  Handle errors ------------------ //
          console.log('RunWhisper: Error running whisper script!');
          const error = new Error('Error running whisper script!');
          reject(error);
        }
      });
    });

    if (transcription.error) {
      console.log('RunWhisper: Error running whisper script!', transcription.error);
      throw new Error('Error running whisper script!');
    }

    return {
      transcription,
      entry
    };
  }
);
