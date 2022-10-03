import { WhisperArgs } from '../../../electron/whisperTypes';
import { RootState } from '../../redux/store';
import { v4 as uuidv4 } from 'uuid';
// Transcription Slice
// This holds the state of the transcriptions and will be updated by electron/node processes

import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
// import { WhisperLanguages } from '../input/components/language/languages';
import { NodeList } from 'subtitle';
import { LoremIpsum } from 'lorem-ipsum';
import { entry, transcriptionStatus } from '../../../electron/types';

export interface entryState {
  entries: entry[];
  activeEntry: string | null;
  thunk_status: 'idle' | 'loading' | 'succeeded' | 'failed' | 'not_found';
}

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4
  },
  wordsPerSentence: {
    max: 16,
    min: 4
  }
});

const initialState: entryState = {
  entries: [],
  activeEntry: null,
  // Thunk State for accessing local files via electron
  thunk_status: 'idle'
};

// Thunk for loading the transcriptions from the database
export const getLocalFiles = createAsyncThunk(
  'entries/getLocalFiles',
  async (): Promise<{ entries?: entry[]; error?: string }> => {
    const result = await window.Main.loadDatabase();
    if (result) {
      return { entries: result.entries };
    } else {
      return { error: 'Error loading database' };
    }
  }
);

export const entrySlice = createSlice({
  name: 'entries',
  initialState,
  reducers: {
    setActiveEntry: (state, action) => {
      // This action is called when a transcription is opened by the user
      state.activeEntry = action.payload;
    },

    addEntry: (state, action) => {
      // This action is called when a transcription is added
      state.entries.push(action.payload);
    },

    updateEntry: (state, action) => {
      // FIXME: Convert to use electron
      // This action is called when a transcription is updated
      const index = state.entries.findIndex((entry) => entry.uuid === action.payload.id);
      if (index !== -1) {
        state.entries[index] = action.payload;
      }
    },

    removeEntry: (state, action) => {
      // FIXME: Convert to use electron to remove from database
      // This action is called when a transcription is removed
      const index = state.entries.findIndex((entry) => entry.uuid === action.payload);
      if (index !== -1) {
        state.entries.splice(index, 1);
      }
    },
    // createDebugEntries: (state) => { // WARN: This will not work anymore with our new database
    //   // Generate a list of transcriptions for testing
    //   const states = [
    //     {
    //       state: transcriptionStatus.PROCESSING,
    //       progress: 40
    //     },
    //     {
    //       state: transcriptionStatus.STALLED,
    //       progress: 75
    //     },
    //     {
    //       state: transcriptionStatus.COMPLETE,
    //       progress: 100
    //     },
    //     {
    //       state: transcriptionStatus.IDLE,
    //       progress: 0
    //     },
    //     {
    //       state: transcriptionStatus.QUEUED,
    //       progress: 0
    //     },
    //     {
    //       state: transcriptionStatus.PENDING,
    //       progress: 0
    //     },
    //     {
    //       state: transcriptionStatus.PROCESSING,
    //       progress: 5
    //     },

    //     {
    //       state: transcriptionStatus.PROCESSING,
    //       progress: 100
    //     },

    //     {
    //       state: transcriptionStatus.UNKNOWN,
    //       progress: 20
    //     },
    //     {
    //       state: transcriptionStatus.UNKNOWN,
    //       progress: 0
    //     },

    //     {
    //       state: transcriptionStatus.CANCELLED,
    //       progress: 40,
    //       error: 'Cancelled by user'
    //     },
    //     {
    //       state: transcriptionStatus.ERROR,
    //       progress: 40,
    //       error: 'Error message'
    //     },
    //     {
    //       state: transcriptionStatus.DELETED,
    //       progress: 40,
    //       error: 'Deleted by user'
    //     }
    //   ];

    //   for (const [index, value] of states.entries()) {
    //     state.entries.push({
    //       id: uuidv4(),
    //       name: `Test ${index}`,
    //       status: value.state,
    //       // id: index,
    //       // title: lorem.generateSentences(1),
    //       // transcriptLength: 300 * index,
    //       // description: `Test Description ${index}`,
    //       // date: `2020-0${index}-0${index}`,
    //       // created: `2020-0${index}-0${index}`,
    //       // tags: ['test', 'tags', `${index}`],

    //       // audioName: lorem.generateSentences(1),
    //       // audioAdded: `2020-0${index}-0${index}`,
    //       // language: 'English',
    //       // model: 'base',
    //       // opened: false,
    //       // length: 100 * index,
    //       // audioFormat: 'mp3',
    //       // transcriptVtt: undefined,
    //       // progress: value.progress,
    //       // status: value.state,
    //       // translated: false,
    //       // directory: `/test/user/desktop/output${index}.txt`,
    //       // transcriptText: undefined,
    //       // error: value.error
    //     });
    //   }
    // },
    test: (state, action) => {
      // This action is a test action
      console.log('test');
      console.log(action.payload);
    }
  },
  extraReducers(builder) {
    // Update the transcription thunk_status when a thunk is called
    builder.addCase(getLocalFiles.pending, (state) => {
      state.thunk_status = 'loading';
    });
    builder.addCase(getLocalFiles.fulfilled, (state, action) => {
      state.thunk_status = 'succeeded';
      if (action.payload.entries) {
        state.entries = action.payload.entries;
      }
    });
    builder.addCase(getLocalFiles.rejected, (state) => {
      state.thunk_status = 'idle';
    });
  }
});

export const { addEntry, updateEntry, removeEntry, test, setActiveEntry } = entrySlice.actions;

// Export Transcription States
export const selectEntries = (state: RootState) => state.entries.entries;
export const selectActiveEntry = (state: RootState) => state.entries.activeEntry;
export const selectNumberOfEntries = (state: RootState) => state.entries.entries.length;

// Export the reducer
export default entrySlice.reducer;
