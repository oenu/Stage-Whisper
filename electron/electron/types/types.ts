import { WhisperArgs } from './whisperTypes';

// Entry Config Object
export type entryConfig = {
  uuid: string; // UUID of the entry
  name: string; // Title of the entry
  description: string; // Description of the entry
  created: number; // Date the entry was created (in milliseconds since 1970)
  inQueue: boolean; // If the entry is in the queue
  queueWeight: number; // Absolute value of the queue weight, 0 is the highest priority
  tags: string[]; // Tags associated with the entry
  activeTranscription: string | null; // The active transcription for the entry

  // ie, when we add a new job to the queue we set that job's priority to the highest queue weight value for an entry with inQueue === true,
  // when the job is done we set inQueue to false and set the queue weight to 0
  //  - this way the queue is always sorted by the queue weight and we don't have to update the queue every time a new job is added
};

// Entry Audio Object
// Represents the information about the audio file for an entry
export type entryAudioParams = {
  type: //Audio files supported by Whisper in the form of an enum
  | 'mp3'
    | 'wav'
    | 'ogg'
    | 'flac'
    | 'aac'
    | 'm4a'
    | 'wma'
    | 'ac3'
    | 'mp2'
    | 'amr'
    | 'aiff'
    | 'au'
    | 'mpc'
    | 'opus'
    | 'tta'
    | 'voc'
    | 'wv'
    | 'webm';
  path: string; // Path to the audio file
  name: string; // Name of the audio file
  language: WhisperArgs['language']; // Language of the audio file
  fileLength: number; // Length of the audio file in seconds
  addedOn: number; // Date the audio file was added to the entry (in milliseconds since 1970)
};

// Entry Transcription Object
// Represents a completed transcription for an entry
export type entryTranscription = {
  uuid: string; // UUID of the transcription
  transcribedOn: number; // Date the transcription was started (in milliseconds since 1970)
  path: string; // Path to the transcription folder
  model: WhisperArgs['model']; // Model used to transcribe the audio
  language: WhisperArgs['language']; // Language of the audio file
  status: transcriptionStatus; // Status of the transcription -- also used to determine if the transcription is complete
  progress: number; // Progress of the transcription
  translated: boolean; // Whether the transcription has been translated
  error: string | undefined; // Error message if the transcription failed
  completedOn: number; // Date the transcription was completed (in milliseconds since 1970)
  data?: transcriptionLine; // The transcript data object
};

// Transcription Data Object
// Represents the transcript data parsed from a VTT file, along with any edits made to the transcript
export type transcriptionLine = {
  index: number; // Index of the line in the transcript
  start: number; // Start time of the transcript line in milliseconds
  end: number; // End time of  the transcript line in milliseconds
  text: string; // Text of the transcript line
  edit: {
    start: number; // Start time of the transcript line in milliseconds
    end: number; // End time of  the transcript line in milliseconds
    text: string; // Text of the transcript line
    deleted: boolean; // Whether the transcript line has been deleted
  } | null; // The transcript line edit object
};

// An entry object - represents
export type entry = {
  config: entryConfig; // Entry Config Object
  audio: entryAudioParams; // Entry Audio Object
  path: string; // Path to the entry folder
  transcriptions: entryTranscription[] | []; // Array of Entry Transcription Objects
};

// List of possible entry statuses
export enum transcriptionStatus {
  IDLE = 'idle', // User has added a file to be transcribed but it has not been added to the queue
  QUEUED = 'queued', // User has indicated they want to transcribe this file
  PENDING = 'pending', // Transcription has started but its progress is unknown
  PROCESSING = 'processing', // Transcription is in progress
  STALLED = 'stalled', // Transcription is taking too long (probably due to a large model)
  ERROR = 'error', // Transcription has failed
  PAUSED = 'paused', // Transcription has been paused by the user
  COMPLETE = 'complete', // Transcription has finished
  CANCELLED = 'cancelled', // Transcription has been cancelled by the user
  DELETED = 'deleted', // Transcription has been deleted by the user
  UNKNOWN = 'unknown' // Transcription status is unknown (probably due to an error talking to the transcriber)
}
