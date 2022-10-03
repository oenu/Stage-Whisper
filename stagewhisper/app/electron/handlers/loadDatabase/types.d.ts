import { WhisperArgs } from '../../whisperTypes';
// Response to a request for the app data from "get-entries"

// Entry Config Object
export type entryConfig = {
  title: string; // Title of the entry
  created: Date; // Date the entry was created
  inQueue: boolean; // If the entry is in the queue
  queueWeight: number; // Absolute value of the queue weight, 0 is the highest priority
  tags: string[]; // Tags associated with the entry
  // ie, when we add a new job to the queue we set that job's priority to the highest queue weight value for an entry with inQueue === true,
  // when the job is done we set inQueue to false and set the queue weight to 0
  //  - this way the queue is always sorted by the queue weight and we don't have to update the queue every time a new job is added
};

// Entry Audio Object
// Represents the information about the audio file for an entry
export type entryAudioParams = {
  type: string; // TODO: Change to enum with whisper accepted types
  path: string; // Path to the audio file
  name: string; // Name of the audio file
  language: WhisperArgs['language']; // Language of the audio file
  addedOn: Date; // Date the audio file was added
};

// Entry Transcription Object
// Represents a completed transcription for an entry
export type entryTranscription = {
  uuid: string; // UUID of the transcription
  transcribedOn: Date; // Date the transcription was completed
  path: string; // Path to the transcription folder
  model: WhisperArgs['model']; // Model used to transcribe the audio
  language: WhisperArgs['language']; // Language of the audio file
  vtt: string; // The transcript in vtt format
  status: transcriptionStatus; // Status of the transcription
  progress: number; // Progress of the transcription
  translated: boolean; // Whether the transcription has been translated
  error: string | undefined; // Error message if the transcription failed
};

// An entry object - represents
export type entry = {
  uuid: string; // UUID of the entry
  config: entryConfig; // Entry Config Object
  audio: entryAudioParams; // Entry Audio Object
  path: string; // Path to the entry folder
  transcriptions: entryTranscription[] | []; // Array of Entry Transcription Objects
  activeTranscription: string; // The active transcription for the entry
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
