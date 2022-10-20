// Components

import { ActionIcon, Button, Divider, Group, Loader, Space, Stack, TextInput, Title } from '@mantine/core';

// import { RichTextEditor } from '@mantine/rte';
// Types

import { Howl } from 'howler';
import { Entry, Line, Transcription } from 'knex/types/tables';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import strings from '../../../localization';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { passToWhisper, selectTranscribingStatus } from '../../whisper/whisperSlice';
import EntryTable from './EntryTable';
import { getLocalFiles, selectActiveLines, setLines } from '../entrySlice';
import { IconCheck, IconEdit, IconTrash, IconX } from '@tabler/icons';
import { showNotification } from '@mantine/notifications';

// import {  Transcription, Line }  from

// Convert an internal audio path to a url that can be used by howler
const filePathToURL = async (filePath: string): Promise<string> => {
  console.time('AudioPlayer: Fetch Audio');
  const result = await window.Main.fetchAudioFile(filePath);
  console.timeEnd('AudioPlayer: Fetch Audio');

  // Check if the fetch was successful
  if (!result) {
    console.log('No Audio File Found');
    throw new Error('No Audio File Found');
  } else {
    // Convert the Uint8Array to a Blob
    const blob = new Blob([result], { type: 'audio/mp3' });
    // Return the blob
    return URL.createObjectURL(blob);
  }
};

// Fetch Transcription Lines from the database
async function GetLines({ transcriptionUUID }: { transcriptionUUID: string }): Promise<Line[]> {
  const result = (await window.Main.GET_LATEST_LINES({ transcriptionUUID })) as Line[];
  if (!result) {
    console.log('No Lines Found');
    throw new Error('No Lines Found');
  } else {
    return result;
  }
}

// Fetch Transcription from the database
async function GetTranscription({
  transcriptionUUID,
  entryUUID
}: {
  transcriptionUUID?: string;
  entryUUID?: string;
}): Promise<Transcription> {
  if (transcriptionUUID) {
    const result = (await window.Main.GET_TRANSCRIPTION({ transcriptionUUID })) as Transcription;
    if (!result) {
      console.log('No Transcription Found');
      throw new Error('No Transcription Found');
    } else {
      return result;
    }
  } else if (entryUUID) {
    const result = (await window.Main.GET_ALL_TRANSCRIPTIONS_FOR_ENTRY({ entryUUID })) as Transcription[];

    if (!result) {
      console.log('No Transcription Found');
      throw new Error('No Transcription Found');
    } else {
      return result[result.length - 1];
    }
  } else {
    throw new Error('No parameters given for GetTranscription');
  }
}

// Get Entry from the database
async function GetEntry({ entryUUID }: { entryUUID: string }): Promise<Entry> {
  const result = (await window.Main.GET_ENTRY({ entryUUID })) as Entry;
  if (!result) {
    console.log('No Entry Found');
    throw new Error('No Entry Found');
  }
  return result;
}

function EntryEditor() {
  const dispatch = useAppDispatch();
  // Params

  const navigate = useNavigate();

  const { entryUUID } = useParams<{ entryUUID: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [transcription, setTranscription] = useState<Transcription | null>(null);
  const transcribingStatus = useAppSelector(selectTranscribingStatus);
  const lines = useAppSelector(selectActiveLines);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [audioPlayer, setAudioPlayer] = useState<Howl | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Entry Name Editing
  const [editingEntryName, setEditingEntryName] = useState<boolean>(false);
  const [entryName, setEntryName] = useState<string>('');

  useEffect(() => {
    setTranscription(null);
    setLines([]);
    setAudioPlayer(null);
    setAudioURL(null);
    setEntry(null);

    setLoading(true);

    if (entryUUID) {
      GetEntry({ entryUUID })
        .then((entry) => {
          setEntryName(entry.name);
          setEntry(entry);
          // console.log('1: Entry Set');
          GetTranscription({ entryUUID: entry.uuid }).then((transcription) => {
            if (transcription) {
              setTranscription(transcription);
              // console.log('2: Transcription Set');
              GetLines({ transcriptionUUID: transcription.uuid })
                .then((lines) => {
                  dispatch(setLines(lines));
                  // console.log('3: Lines Set');
                })
                .then(() => {
                  if (entry.audio_path) {
                    filePathToURL(entry.audio_path).then((url) => {
                      setAudioURL(url);
                      // console.log('4: Audio URL Set');

                      const newAudioPlayer = new Howl({
                        src: [url],
                        html5: true,
                        format: ['mp3'],
                        preload: true
                      });
                      // console.log('5: Audio Player Set');
                      newAudioPlayer.on('load', () => {
                        // console.log('6: Audio Player Loaded');
                        setAudioPlayer(newAudioPlayer);
                      });
                      newAudioPlayer.once('loaderror', (_id, error) => {
                        console.log('Audio Player Load Error ', error);
                      });
                    });
                  } else {
                    console.log('No Audio Path Found');
                    throw new Error('No Audio Path Found');
                  }
                });
            } else {
              console.log("No Transcription Found, can't load lines!");
            }
          });
        })
        .catch((error) => {
          console.log(error);
          setLoading(false);
        });
    } else {
      console.log('No Entry UUID Found');
      setEntryName('');
    }
  }, [entryUUID]);

  useEffect(() => {
    // If the audio player is not null
    if (audioPlayer) {
      console.debug('AudioControls: Audio Player Changed');
      // Construct the audio controls
      // setAudioControls(AudioControls(audioPlayer));
    }
  }, [audioPlayer]);

  if (entry && transcription && lines && audioURL && audioPlayer) {
    return (
      <>
        <Stack>
          <Group noWrap position="apart">
            {editingEntryName ? (
              <TextInput
                value={entryName}
                onChange={(e) => {
                  setEntryName(e.target.value);
                }}
              />
            ) : (
              <Title order={3}>{entryName}</Title>
            )}

            <Group>
              {editingEntryName ? (
                <ActionIcon
                  color="blue"
                  onClick={() => {
                    try {
                      if (entryName) {
                        const newEntry = {
                          ...entry,
                          name: entryName
                        };
                        setEditingEntryName(false);

                        window.Main.UPDATE_ENTRY({ entry: newEntry })
                          .then(() => {
                            showNotification({
                              title: 'Entry Updated',
                              message: 'Entry name updated successfully',
                              icon: <IconCheck />,
                              autoClose: 3000,
                              disallowClose: true
                            });
                          })
                          .catch(() => {
                            showNotification({
                              title: 'Entry Update Failed',
                              message: 'Entry name update failed',
                              icon: <IconX />,
                              autoClose: 3000,
                              disallowClose: true
                            });
                          });
                      } else {
                        showNotification({
                          title: 'Entry Update Failed',
                          message: 'Entry name cannot be empty',
                          icon: <IconX />,
                          autoClose: 3000,
                          disallowClose: true
                        });
                      }
                    } catch (error) {
                      console.log(error);
                    }
                  }}
                  variant="outline"
                >
                  <IconCheck size={16} />
                </ActionIcon>
              ) : (
                <ActionIcon
                  color="blue"
                  onClick={() => {
                    // Edit this line
                    setEditingEntryName(true);
                  }}
                  variant="outline"
                >
                  <IconEdit size={16} />
                </ActionIcon>
              )}

              <ActionIcon
                color="red"
                disabled={
                  entry && transcribingStatus.entry?.uuid === entry.uuid && transcribingStatus.status === 'loading'
                }
                onClick={async () => {
                  try {
                    const normalizedEntry = (await window.Main.GET_ENTRY({ entryUUID: entry.uuid })) as Entry;
                    if (!normalizedEntry) throw new Error('Entry not found');
                    await window.Main.deleteEntry(normalizedEntry)
                      .then(() => {
                        console.log('Deleted: Reloading local files');
                        dispatch(getLocalFiles());
                        navigate('/entries');
                        showNotification({
                          title: 'Entry Deleted',
                          message: 'The entry was successfully deleted',
                          autoClose: 3000,
                          disallowClose: true,
                          icon: <IconCheck size={16} />
                        });
                      })
                      .catch((error) => {
                        console.log(error);
                        showNotification({
                          title: 'Error Deleting Entry',
                          message: 'There was an error deleting the entry',
                          autoClose: 3000,
                          disallowClose: true,
                          icon: <IconX size={16} />
                        });
                      });
                  } catch (e) {
                    console.log('Error deleting entry', e);
                    console.log(e);
                  }
                }}
                variant="outline"
              >
                {/* HACK: Delete is disabled until a way to sync changes is complete */}
                <IconTrash size={16} />
              </ActionIcon>
            </Group>
          </Group>
          <EntryTable entry={entry} audioPlayer={audioPlayer} />
        </Stack>
      </>
    );
  }

  if (entry && transcribingStatus.entry?.uuid === entry.uuid && transcribingStatus.status === 'loading') {
    return (
      <Stack align={'center'} justify="center" style={{ height: '80%' }}>
        <Title order={3}>Transcribing</Title>
        <Loader variant="dots" />
      </Stack>
    );
  }

  if (entry && !transcription) {
    return (
      <Stack align={'center'} justify="center" style={{ height: '80%' }}>
        <Title order={3}>No Transcription Found</Title>
        <Button
          onClick={() => {
            if (entry) {
              dispatch(passToWhisper({ entry }));
            } else {
              console.warn("No Entry Found, can't pass to whisper");
              // This should eventually be a modal
            }
          }}
          color="violet"
          variant="outline"
          disabled={transcribingStatus.status === 'loading'}
        >
          {strings.util.buttons?.transcribe}
        </Button>
      </Stack>
    );
  }

  // Fallback States if something goes wrong
  if (!entry && !loading) {
    return (
      <Stack align={'center'} justify="center" style={{ height: '80%' }}>
        <Title order={3}>No Entry Found</Title>
      </Stack>
    );
  } else if (!transcription && !loading) {
    return (
      <Stack align={'center'} justify="center" style={{ height: '80%' }}>
        <Title order={3}>Transcription Not Found</Title>
      </Stack>
    );
  } else if (!lines && !loading) {
    return (
      <Stack align={'center'} justify="center" style={{ height: '80%' }}>
        <Title order={3}>Lines Not Found</Title>
      </Stack>
    );
  } else if (!audioURL && !loading) {
    return (
      <Stack align={'center'} justify="center" style={{ height: '80%' }}>
        <Title order={3}>Audio URL Not Found</Title>
      </Stack>
    );
  } else if (!audioPlayer && !loading) {
    return (
      <Stack align={'center'} justify="center" style={{ height: '80%' }}>
        <Title order={3}>Audio Player Not Found</Title>
      </Stack>
    );
  } else {
    return (
      <Stack align={'center'} justify="center" style={{ height: '80%' }}>
        <Loader variant="dots" />
      </Stack>
    );
  }
}

export default EntryEditor;
