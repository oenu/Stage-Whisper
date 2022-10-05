import {
  Accordion,
  Button,
  ButtonVariant,
  Card,
  Center,
  Divider,
  Grid,
  Group,
  Loader,
  MantineColor,
  Progress,
  Stack,
  Text,
  Title
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconFileDescription } from '@tabler/icons';
import React, { useState } from 'react';

// Redux

import { entry, transcriptionStatus } from '../../../../electron/types/types';

// Localization

import strings from '../../../localization';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { passToWhisper, selectTranscribingStatus } from '../../whisper/whisperSlice';
import { setActiveEntry } from '../entrySlice';

//#region Component Helpers
const progressIndicator = (active_transcript: entry['transcriptions'][0]) => {
  // Import localization strings
  const labels = strings.util.status;

  const states: {
    [key in transcriptionStatus]: {
      color: string; // Color of the progress bar
      showFilled: boolean; // Whether the progress bar should be filled or reflect the transcript.progress value
      animated: boolean; // Whether the progress bar should be animated
      striped: boolean; // Whether the progress bar should be striped
      label: string | undefined; // The label to display on the progress bar
    };
  } = {
    idle: {
      color: 'gray',
      showFilled: true,
      animated: false,
      striped: true,
      label: labels?.idle
    },
    queued: {
      color: 'dimmed',
      showFilled: true,
      animated: true,
      striped: true,
      label: labels?.queued
    },
    pending: {
      color: 'violet',
      showFilled: true,
      animated: true,
      striped: true,
      label: labels?.pending
    },
    processing: {
      color: 'blue',
      showFilled: false,
      animated: true,
      striped: true,
      label: labels?.processing
    },
    stalled: {
      color: 'orange',
      showFilled: false,
      animated: true,
      striped: true,
      label: labels?.stalled
    },
    error: {
      color: 'red',
      showFilled: true,
      animated: false,
      striped: true,
      label: labels?.error
    },
    paused: {
      color: 'yellow',
      showFilled: false,
      animated: false,
      striped: true,
      label: labels?.paused
    },
    complete: {
      color: 'green',
      showFilled: true,
      animated: false,
      striped: true,
      label: labels?.complete
    },
    cancelled: {
      color: 'gray',
      showFilled: true,
      animated: false,
      striped: true,
      label: labels?.cancelled
    },
    deleted: {
      color: 'gray',
      showFilled: true,
      animated: false,
      striped: true,
      label: labels?.deleted
    },
    unknown: {
      color: 'gray',
      showFilled: true,
      animated: false,
      striped: true,
      label: labels?.unknown
    }
  };

  const state = states[active_transcript.status];

  return (
    <Progress
      color={state.color}
      value={state.showFilled ? 100 : active_transcript.progress}
      animate={state.animated}
      striped={state.striped}
      label={state.label}
      size="xl"
    />
  );
};

// #endregion

function TranscriptionCard({ entry }: { entry: entry }) {
  const dispatch = useAppDispatch();

  // Local state for the entry card - used to show/hide the file/entry details
  const [expanded, setExpanded] = useState<string[]>([]);

  // The current active entry and transcription
  // may not be the same as the entry passed into this component
  const transcribing = useAppSelector(selectTranscribingStatus);

  // Detect mobile view
  const isMobile = useMediaQuery('(max-width: 600px)');

  const activeTranscription = entry.transcriptions.find(
    (transcription) => transcription.uuid === entry.config.activeTranscription // TODO: Implement a way to view all transcriptions not just active
  );

  const buttons =
    entry.transcriptions.length > 0 ? (
      // Has transcriptions
      <>
        <Button
          onClick={() => {
            dispatch(setActiveEntry(entry));
          }}
          color="green"
          variant="outline"
        >
          {strings.util.buttons?.open}
        </Button>
        <Button
          onClick={() => {
            console.log('Delete');
          }}
          color="red"
          variant="outline"
          disabled={transcribing.status === 'loading' && transcribing.entry?.config.uuid === entry.config.uuid}
        >
          {strings.util.buttons?.delete}
        </Button>
      </>
    ) : (
      // No transcriptions
      <>
        <Button
          onClick={() => {
            dispatch(passToWhisper({ entry }));
          }}
          color="green"
          variant="outline"
          disabled={transcribing.status === 'loading'}
        >
          {strings.util.buttons?.transcribe}
        </Button>
        <Button
          onClick={() => {
            console.log('Delete');
          }}
          color="red"
          variant="outline"
          disabled={transcribing.status === 'loading' && transcribing.entry?.config.uuid === entry.config.uuid}
        >
          {strings.util.buttons?.delete}
        </Button>
      </>
    );

  const content = (
    <Card withBorder>
      <Grid grow>
        <Grid.Col span={isMobile ? 12 : 8}>
          <Stack justify={'center'}>
            <Group>
              {transcribing?.entry?.config.uuid === entry.config.uuid ? <Loader /> : <IconFileDescription size={40} />}
              {/* Loader */}

              {/* Title */}
              <Stack justify={'center'}>
                <Text style={{ textOverflow: 'ellipsis', wordBreak: 'break-all', overflow: 'hidden' }}>
                  {entry.config.name}
                </Text>
                {entry.config.description && (
                  <Title italic order={6} lineClamp={1}>
                    {entry.config.description}
                  </Title>
                )}
              </Stack>
            </Group>
            <Divider hidden={!isMobile} />
          </Stack>
        </Grid.Col>
        <Divider orientation="vertical" hidden={isMobile} />

        {/* Buttons */}
        <Grid.Col span={isMobile ? 12 : 3}>
          {/* Buttons */}
          <Center style={{ width: '100%' }}>
            {isMobile ? <Group>{buttons}</Group> : <Stack style={{ width: '90%' }}>{buttons}</Stack>}
          </Center>
        </Grid.Col>
      </Grid>
    </Card>
  );
  return content;
}
export default TranscriptionCard;
