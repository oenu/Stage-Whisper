// List of all channels used by electron IPC

export enum Channels {
  // Utility channels
  // Trigger a directory picker
  openDirectoryDialog = 'open-directory-dialog',

  // Database channels
  loadDatabase = 'load-database', // Loads all entries from the database and returns them
  newEntry = 'new-entry', // Creates a new entry in the database and returns it

  // Whisper channels
  runWhisper = 'run-whisper', // Runs the whisper model with given arguments and returns the entry
  whisperComplete = 'whisper-complete', // Returns the entry and path to the transcription
  whisperError = 'whisper-error' // Returns the error message
}

// Channel Response Types

// Response type for the load-database channel
export interface LoadDatabaseResponse {
  entries: entry[];
  error?: string;
}

// Response type for the new-entry channel
export interface NewEntryResponse {
  entry: entry;
  error?: string;
}

// Response type for the run-whisper channel
export interface RunWhisperResponse {
  transcription_uuid: string;
  outputDir: string;
}

// Response type for the whisper-complete channel
export interface WhisperCompleteResponse {
  outputDir: string;
  code: number;
  entry: entry;
  uuid: string;
}

// Response type for the whisper-error channel
export interface WhisperErrorResponse {
  transcription_uuid: string;
  error: string;
  entry: entry;
}
