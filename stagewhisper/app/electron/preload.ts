import { newEntryArgs } from './handlers/newEntry/newEntry';
import { WhisperArgs } from './whisperTypes';
import { ipcRenderer, contextBridge } from 'electron';
import { entry } from './types';

// import { languages } from '../src/components/language/languages';

declare global {
  interface Window {
    Main: typeof api;
    ipcRenderer: typeof ipcRenderer;
  }
}

const api = {
  // Add a new file to the database
  newEntry: async (args: newEntryArgs) => {
    const result = await ipcRenderer.invoke('new-entry', args);

    if (result.error) {
      throw result.error;
    } else {
      return result.entry;
    }
  },

  // Run the whisper model with given arguments
  runWhisper: (args: WhisperArgs) => {
    ipcRenderer.invoke('run-whisper', args);
  },

  // Get the list of all entries stored in the app database
  loadDatabase: async (): Promise<{ entries: entry[]; error?: string }> => {
    const result = (await ipcRenderer.invoke('load-database')) as { entries: entry[]; error?: string };
    return result;
  },

  // Trigger an OS level directory picker
  openDirectoryDialog: async () => {
    const result = await ipcRenderer.invoke('open-directory-dialog');
    return result;
  },

  // Testing: Load a file from the app directory
  loadVttFromFile: async (path: string, exampleData: boolean) => {
    if (exampleData === true) {
      const result = (await ipcRenderer.invoke('load-vtt-from-file', path, exampleData)) as NodeList;
      return result;
    } else {
      const result = (await ipcRenderer.invoke('load-vtt-from-file', path)) as NodeList;
      return result;
    }
  },

  on: (channel: string, callback: (data: any) => void) => {
    ipcRenderer.on(channel, (_, data) => callback(data));
  }
};
contextBridge.exposeInMainWorld('Main', api);
/**
 * Using the ipcRenderer directly in the browser through the contextBridge ist not really secure.
 * I advise using the Main/api way !!
 */
contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer);
