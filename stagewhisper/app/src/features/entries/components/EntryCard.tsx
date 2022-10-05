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
type buttonTypes =
  | 'edit' // Edit the entry
  | 'delete' // Delete the entry
  | 'cancel' // Cancel the entry (if it is queued or pending)
  | 'pause' // Pause the entry (if it is processing)
  | 'resume' // Resume the entry (if it is paused)
  | 'download' // Download the entry
  | 'retry' // Retry the entry (if it is in an error state)
  | 'restore' // Restore the entry (if it is deleted)
  | 'queue' // Queue the entry (if it is idle)
  | 'open' // Open the entry detail view (if it is complete)
  | 'close' // Close the entry in the editor
  | 'play' // Play the entry original audio
  | 'stop' // Stop the entry original audio
  | 'transcribe'; // Transcribe the entry

const buttonConstructor = (buttonType: buttonTypes, buttonEntry: entry) => {
  const dispatch = useAppDispatch();

  const buttonStrings = strings.util.buttons;

  const buttons: {
    // TODO: None of these buttons do anything as I need to build out the redux actions and decide on a naming convention
    [key in buttonTypes]: {
      dispatchAction: string;
      label: string;
      color: MantineColor;
      style: ButtonVariant;
    };
  } = {
    edit: {
      dispatchAction: '', // TODO: Add an action for this
      label: buttonStrings?.edit || 'Edit',
      color: 'red',
      style: 'default'
    },
    delete: {
      dispatchAction: '', // TODO: Add an action for this in the style reduxstore/dispatchAction
      label: buttonStrings?.delete || 'Delete',
      color: 'red',
      style: 'outline'
    },
    cancel: {
      dispatchAction: '', // TODO: Add an action for this in the style reduxstore/dispatchAction
      label: buttonStrings?.cancel || 'Cancel',
      color: 'red',
      style: 'default'
    },
    pause: {
      dispatchAction: '', // TODO: Add an action for this in the style reduxstore/dispatchAction
      label: buttonStrings?.pause || 'Pause',
      color: 'red',
      style: 'default'
    },
    resume: {
      dispatchAction: '', // TODO: Add an action for this in the style reduxstore/dispatchAction
      label: buttonStrings?.resume || 'Resume',
      color: 'red',
      style: 'default'
    },
    download: {
      dispatchAction: '', // TODO: Add an action for this in the style reduxstore/dispatchAction
      label: buttonStrings?.download || 'Download',
      color: 'red',
      style: 'default'
    },
    retry: {
      dispatchAction: '', // TODO: Add an action for this in the style reduxstore/dispatchAction
      label: buttonStrings?.retry || 'Retry',
      color: 'red',
      style: 'default'
    },
    restore: {
      dispatchAction: '', // TODO: Add an action for this in the style reduxstore/dispatchAction
      label: buttonStrings?.restore || 'Restore',
      color: 'red',
      style: 'default'
    },
    queue: {
      dispatchAction: '', // TODO: Add an action for this in the style reduxstore/dispatchAction
      label: buttonStrings?.queue || 'Queue',
      color: 'red',
      style: 'default'
    },
    open: {
      dispatchAction: 'entries/setActiveEntry',
      label: buttonStrings?.open || 'Open',
      color: 'primary',
      style: 'outline'
    },
    close: {
      dispatchAction: '', // TODO: Add an action for this in the style reduxstore/dispatchAction
      label: buttonStrings?.close || 'Close',
      color: 'red',
      style: 'default'
    },
    play: {
      dispatchAction: '', // TODO: Add an action for this in the style reduxstore/dispatchAction
      label: buttonStrings?.play || 'Play',
      color: 'red',
      style: 'default'
    },
    stop: {
      dispatchAction: '', // TODO: Add an action for this in the style reduxstore/dispatchAction
      label: buttonStrings?.stop || 'Stop',
      color: 'red',
      style: 'default'
    },
    transcribe: {
      dispatchAction: 'whisper/passToWhisper',
      label: buttonStrings?.transcribe || 'Transcribe',
      color: 'green',
      style: 'outline'
    }
  };

  return (
    <Button
      key={buttonType}
      onClick={() => {
        if (buttons[buttonType].dispatchAction) {
          dispatch({ type: buttons[buttonType].dispatchAction, payload: buttonEntry });
        } else {
          console.log('No dispatch action for this button: ', buttonType);
        }
      }}
      size="sm"
      color={buttons[buttonType].color}
      variant={buttons[buttonType].style}
      // disabled // TODO: Add logic to these buttons, then remove this
    >
      {buttons[buttonType].label}
    </Button>
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
        {buttonConstructor('open', entry)}
        {buttonConstructor('delete', entry)}
      </>
    ) : (
      // No transcriptions
      <>
        {buttonConstructor('transcribe', entry)}
        {buttonConstructor('delete', entry)}
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
