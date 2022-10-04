import { mkdirSync } from 'fs';
import { spawn } from 'child_process';
import { ipcMain, IpcMainInvokeEvent } from 'electron';
import { WhisperArgs } from '../../whisperTypes';
import { v4 as uuidv4 } from 'uuid';
import { entry } from '../../types';
import { join } from 'path';
import { Channels, RunWhisperResponse } from '../channels';

export default ipcMain.handle(
  Channels.runWhisper,
  async (_event: IpcMainInvokeEvent, args: WhisperArgs, entry: entry): Promise<RunWhisperResponse> => {
    const { inputPath } = args;

    // Generate UUID for the entry
    const uuid = uuidv4();

    // Generate output path
    const outputDir = join(entry.path, 'transcriptions', uuid);
    console.log('RunWhisper: outputDir', outputDir);

    // Generate folder for the entry
    console.log('RunWhisper: Creating output directory...');
    mkdirSync(outputDir, { recursive: true });
    console.log('RunWhisper: Output directory created.');

    // Run Whisper

    console.log('Running whisper script');
    console.log('args: ', args);

    // const out = spawn('whisper', ['--model', 'base.en', '--output_dir', join(__dirname, '../src/debug/data')]);
    const out = spawn('whisper', [inputPath, '--model', 'tiny.en', '--output_dir', outputDir]);

    out.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });
    out.stderr.on('data', (err) => {
      console.log(`stderr: ${err}`);
    });
    out.on('message', (message) => {
      console.log(`message: ${message}`);
    });

    out.on('close', (code) => {
      console.log(`child process exited with code ${code}`);
      ipcMain.emit(Channels.whisperComplete, code, outputDir, uuid);
    });

    return { transcription_uuid: uuid, outputDir };
  }
);
