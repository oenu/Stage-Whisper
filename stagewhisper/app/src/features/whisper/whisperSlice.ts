import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
// import { RunWhisperResponse } from '../../../electron/types/channels';
import { entry } from '../../../electron/types/types';
// import { WhisperArgs } from '../../../electron/types/whisperTypes';
// import { RootState } from '../../redux/store';

// WhisperSlice
// Slice for managing requests to whisper and the queue of requests

export type queueEntry = {
  // Represents an entry in the queue
  transcription_id?: string; // Id of the transcription
  entry: entry; // Entry that requested the transcription
  status: 'idle' | 'loading' | 'succeeded' | 'failed'; // Status of the transcription
};

export type whisperState = {
  // Represents the state of the whisper slice
  queue: queueEntry[]; // Queue of transcriptions
  activeEntry: queueEntry | null; // Id of the active entry
  status:
    | 'idle' // idle: no transcriptions are running, will attempt to run the next transcription in the queue
    | 'loading' // loading: a transcription is running
    | 'succeeded' // succeeded: the last transcription was successful
    | 'failed' // failed: the last transcription failed
    | 'disabled'; // disabled: adding new transcriptions to the queue is disabled
};

const initialState: whisperState = {
  queue: [],
  activeEntry: null,
  status: 'disabled'
};

// // Thunk for running a whisper transcription from the queue
// export const whisperTranscribe = createAsyncThunk(
//   'whisper/whisperTranscribe',
//   async (entry: entry): Promise<{ result?: RunWhisperResponse; error?: string }> => {
//     const args: WhisperArgs = {
//       inputPath: entry.audio.path
//     };
//     const result = await window.Main.runWhisper(args, entry);

//     window.
//     if (result) {
//       return { result };
//     } else {
//       throw { error: 'Error running whisper' };
//     }
//   }
// );

// Thunk that can be called to process the next transcription if it exists
export const processNextTranscription = createAsyncThunk(
  'whisper/processNextTranscription',
  async (): Promise<void> => {
    return;
  }
);

export const whisperSlice = createSlice({
  name: 'whisper',
  initialState,
  reducers: {
    addToQueue: (state, action: PayloadAction<entry>) => {
      // Add an entry to the queue
      state.queue.push({ entry: action.payload, status: 'idle' });
    },
    removeFromQueue: (state, action: PayloadAction<entry>) => {
      // Remove an entry from the queue
      state.queue = state.queue.filter((entry) => entry.entry.config.uuid !== action.payload.config.uuid);
    },
    setStatus: (state, action: PayloadAction<'idle' | 'loading' | 'succeeded' | 'failed' | 'disabled'>) => {
      // Set the status of the queue
      state.status = action.payload;
    },
    setActiveEntry: (state, action: PayloadAction<queueEntry | null>) => {
      // Set the active entry
      state.activeEntry = action.payload;
    },
    setQueue: (state, action: PayloadAction<queueEntry[]>) => {
      // Set the queue
      state.queue = action.payload;
    },
    clearQueue: (state) => {
      // Clear the queue
      state.queue = [];
    },
    clearActiveEntry: (state) => {
      // Clear the active entry
      state.activeEntry = null;
    },
    clearStatus: (state) => {
      // Clear the status
      state.status = 'idle';
    }
  }
  // extraReducers: (builder) => {
  //   // When a whisperTranscribe thunk is dispatched
  //   builder.addCase(whisperTranscribe.pending, (state) => {
  //     // Set the status to loading
  //     state.status = 'loading';
  //   });
  //   builder.addCase(whisperTranscribe.fulfilled, (state, action) => {
  //     // If the transcription was successful
  //     if (action.payload.result) {
  //       // Set the status to succeeded
  //       state.status = 'succeeded';
  //       // Remove the transcription from the queue
  //       state.queue = state.queue.filter((entry) => entry.transcription_id !== action.payload.result?.transcription_uuid);
  //       // Set the active entry to null
  //       state.activeEntry = null;
  //     } else {
  //       // If the transcription
});

export const {
  addToQueue,
  removeFromQueue,
  setStatus,
  setActiveEntry,
  setQueue,
  clearQueue,
  clearActiveEntry,
  clearStatus
} = whisperSlice.actions;

export default whisperSlice.reducer;
