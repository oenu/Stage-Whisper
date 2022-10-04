import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { entry } from '../../../electron/types/types';
import { RootState } from '../../redux/store';

// WhisperSlice
// Slice for managing requests to whisper and the queue of requests

export type queueEntry = {
  // Represents an entry in the queue
  id: string; // Id of the transcription
  entry: entry; // Entry that requested the transcription
  status: 'idle' | 'loading' | 'succeeded' | 'failed'; // Status of the transcription
};

export type whisperState = {
  // Represents the state of the whisper slice
  queue: queueEntry[]; // Queue of transcriptions
  activeEntry: string | null; // Id of the active entry
  status: 'idle' | 'loading' | 'succeeded' | 'failed' | 'disabled'; // Status of the slice
};

const initialState: whisperState = {
  queue: [],
  activeEntry: null,
  status: 'idle'
};

const whisperSlice = createSlice({
  name: 'whisper',
  initialState,
  reducers: {
    addRequestToQueue: (state, action) => {
      state.queue.push(action.payload);
    }
  }
});

// Active Transcription Thunk
// This thunk controls the passing of entries to whisper and the queueing of entries
const activeTranscriptionThunk = createAsyncThunk(
  'whisper/activeTranscriptionThunk',
  async (entry: entry, { dispatch, getState }) => {
    // Get the current state
    const state = getState() as RootState;
    // Get the current queue
    const queue = state.whisper.queue;
    // Get the current active entry
    const activeEntry = state.whisper.activeEntry;
    // Get the current status
  }
);

// export const {} = whisperSlice.actions;

export default whisperSlice.reducer;
