import React, { useEffect, useState } from 'react';

// Components
import { Text, Center, Grid, Stack, Card } from '@mantine/core';
// import { RichTextEditor } from '@mantine/rte';

// Types
import { entry, entryTranscription } from '../../../../electron/types/types';

// Redux
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { Node } from 'subtitle';
import AudioPlayer from './AudioPlayer';
import { selectTranscribingStatus } from '../../whisper/whisperSlice';
import { selectActiveEntry, selectEntries } from '../entrySlice';

// Vtt Viewer Component
// Shows a line of dialogue and the corresponding subtitle
const vttLine = (vtt: Node) => {
  // Check if the vtt line is a cue
  if (vtt.type === 'cue') {
    // Get the start and end times
    const start = vtt.data.start;
    const end = vtt.data.end;

    return (
      <Grid style={{ width: '100%' }} key={`${vtt.data.start}-${vtt.data.end}`}>
        <Card style={{ width: '100%' }} withBorder>
          <Center>
            <Text>{vtt.data.text}</Text>
          </Center>
          <Center>
            <Text>
              {start / 1000}s - {end / 1000}s
            </Text>
          </Center>
        </Card>
      </Grid>
    );
  }
};

// This is a component that will be used to display the transcription editor when an entry is selected
function EntryEditor({ entry }: { entry: entry }) {
  // If the entry has a transcription
  if (entry?.transcriptions.length > 0) {
    // Select the most recent transcription //FIXME: This should eventually be a selector
    const transcription = entry.transcriptions.sort((a, b) => {
      return b.completedOn - a.completedOn;
    })[0];

    if (transcription === undefined) {
      // If the transcription is undefined, return an error
      return (
        <Center>
          <Stack style={{ width: '100%', maxWidth: 1100 }} spacing="md">
            <Text>No Transcription Found</Text>
          </Stack>
        </Center>
      );
    } else if (!transcription.vtt) {
      // If the transcription is missing a VTT, show error
      return (
        <Center>
          <Stack style={{ width: '100%', maxWidth: 1100 }} spacing="md">
            <Text>No VTT Found</Text>
          </Stack>
        </Center>
      );
    } else {
      // If the transcription exists, and has a vtt, display them
      return (
        <Center>
          <Stack style={{ width: '100%', maxWidth: 1100 }} spacing="md">
            <AudioPlayer filePath={entry.audio.path} />
            {transcription.vtt.map((vtt) => {
              return vttLine(vtt);
            })}
          </Stack>
        </Center>
      );
    }
  } else {
    // If the entry has no transcriptions, show an error
    return (
      <Center>
        <Stack style={{ width: '100%', maxWidth: 1100 }} spacing="md">
          <Text>No Transcription Found</Text>
        </Stack>
      </Center>
    );
  }
}

export default EntryEditor;
