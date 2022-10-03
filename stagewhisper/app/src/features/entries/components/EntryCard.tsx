import {
  Accordion,
  Button,
  ButtonVariant,
  Card,
  Divider,
  Grid,
  Group,
  MantineColor,
  Progress,
  Stack,
  Text,
  Title
} from '@mantine/core';
import React, { useState } from 'react';

// Redux

import { entry, transcriptionStatus } from '../../../../electron/handlers/loadDatabase/types';

// Localization
import { useDispatch } from 'react-redux';
import strings from '../../../localization';

//#region Component Helpers
const progressIndicator = (entry: entry['transcriptions'][0]) => {
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

  const state = states[entry.transcriptionStatus];

  return (
    <Progress
      color={state.color}
      value={state.showFilled ? 100 : entry.progress}
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
  | 'stop'; // Stop the entry original audio

const buttonConstructor = (buttonType: buttonTypes, buttonId: number) => {
  const dispatch = useDispatch();

  const buttonStrings = strings.util.buttons;

  const buttons: {
    [key in buttonTypes]: {
      dispatchAction: string;
      label: string;
      color: MantineColor;
      style: ButtonVariant;
    };
  } = {
    edit: {
      dispatchAction: 'transcriptions/editTranscription',
      label: buttonStrings?.edit || 'Edit',
      color: 'red',
      style: 'default'
    },
    delete: {
      dispatchAction: 'transcriptions/deleteTranscription',
      label: buttonStrings?.delete || 'Delete',
      color: 'red',
      style: 'default'
    },
    cancel: {
      dispatchAction: 'transcriptions/cancelTranscription',
      label: buttonStrings?.cancel || 'Cancel',
      color: 'red',
      style: 'default'
    },
    pause: {
      dispatchAction: 'transcriptions/pauseTranscription',
      label: buttonStrings?.pause || 'Pause',
      color: 'red',
      style: 'default'
    },
    resume: {
      dispatchAction: 'transcriptions/resumeTranscription',
      label: buttonStrings?.resume || 'Resume',
      color: 'red',
      style: 'default'
    },
    download: {
      dispatchAction: 'transcriptions/downloadTranscription',
      label: buttonStrings?.download || 'Download',
      color: 'red',
      style: 'default'
    },
    retry: {
      dispatchAction: 'transcriptions/retryTranscription',
      label: buttonStrings?.retry || 'Retry',
      color: 'red',
      style: 'default'
    },
    restore: {
      dispatchAction: 'transcriptions/restoreTranscription',
      label: buttonStrings?.restore || 'Restore',
      color: 'red',
      style: 'default'
    },
    queue: {
      dispatchAction: 'transcriptions/queueTranscription',
      label: buttonStrings?.queue || 'Queue',
      color: 'red',
      style: 'default'
    },
    open: {
      dispatchAction: 'transcriptions/openTranscription',
      label: buttonStrings?.open || 'Open',
      color: 'red',
      style: 'default'
    },
    close: {
      dispatchAction: 'transcriptions/closeTranscription',
      label: buttonStrings?.close || 'Close',
      color: 'red',
      style: 'default'
    },
    play: {
      dispatchAction: 'transcriptions/playTranscription',
      label: buttonStrings?.play || 'Play',
      color: 'red',
      style: 'default'
    },
    stop: {
      dispatchAction: 'transcriptions/stopTranscription',
      label: buttonStrings?.stop || 'Stop',
      color: 'red',
      style: 'default'
    }
  };

  return (
    <Button
      key={buttonType}
      onClick={() => {
        dispatch({ type: buttons[buttonType].dispatchAction, payload: { id: buttonId } });
      }}
      size="sm"
      color={buttons[buttonType].color}
      variant={buttons[buttonType].style}
    >
      {buttons[buttonType].label}
    </Button>
  );
};

const buttonBlock = (transcript: entry) => {
  // Create a group of buttons to display based on the current state of the entry
  const buttonList: buttonTypes[] = [];

  switch (transcript.status) {
    case 'idle':
      buttonList.push('edit', 'delete', 'queue');
      break;
    case 'queued':
      buttonList.push('edit', 'delete', 'cancel');
      break;
    case 'pending':
      buttonList.push('edit', 'delete', 'cancel');
      break;
    case 'processing':
      buttonList.push('edit', 'delete', 'pause');
      break;
    case 'stalled':
      buttonList.push('edit', 'delete', 'retry');
      break;
    case 'error':
      buttonList.push('edit', 'delete', 'retry');
      break;
    case 'paused':
      buttonList.push('edit', 'delete', 'resume');
      break;
    case 'complete':
      buttonList.push('edit', 'delete', 'download', 'open');
      break;
    case 'cancelled':
      buttonList.push('edit', 'delete', 'restore');
      break;
    case 'deleted':
      buttonList.push('edit', 'restore');
      break;
  }

  // Return a list of buttons
  return (
    <Group position={'left'}>{buttonList.map((buttonType) => buttonConstructor(buttonType, transcript.id))}</Group>
  );
};

// #endregion

function TranscriptionCard({ entry }: { entry: entry }) {
  // Local state for the entry card - used to show/hide the file/entry details
  const [expanded, setExpanded] = useState<string[]>([]);

  return (
    <Card withBorder>
      <Group>
        <Title order={2} lineClamp={2}>
          {entry.title}
        </Title>
      </Group>

      <Title italic order={6} lineClamp={1}>
        {entry.description}
      </Title>
      <Divider mt="xs" mb="xs" />

      <Grid align={'flex-start'}>
        <Grid.Col md={6} sm={12}>
          {/* Column containing information about the entry */}
          <Stack spacing="xs" justify={'space-between'} style={{ minHeight: '900' }}>
            <Accordion multiple variant="contained" value={expanded} onChange={setExpanded}>
              {/* StageWhisper information */}
              <Accordion.Item value="entry">
                <Accordion.Control>
                  <Title order={3}>{strings.transcriptions?.card.transcription_section_title}</Title>
                </Accordion.Control>
                <Accordion.Panel>
                  {/* Transcription Completed Date  */}
                  <Text weight={700}>
                    {strings.transcriptions?.card.completed_on}:{' '}
                    {entry.status === 'complete' ? (
                      <Text weight={500} span>
                        {entry.created}
                      </Text>
                    ) : (
                      <Text weight={500} span transform="capitalize">
                        {strings.transcriptions?.card.never_completed}
                      </Text>
                    )}
                  </Text>
                  {/* Transcription Model Used  */}
                  <Text weight={700}>
                    {strings.transcriptions?.card.model_used}:{' '}
                    <Text weight={500} transform="capitalize" span>
                      {entry.model}
                    </Text>
                  </Text>
                  {/* Transcription File Length */}
                  <Text weight={700}>
                    Model:{' '}
                    <Text weight={500} transform="capitalize" span>
                      {entry.model}
                    </Text>
                  </Text>
                  {/* Transcription File Location  */}
                  <Text weight={700}>
                    {strings.transcriptions?.card.output_directory}:{' '}
                    <Text weight={500} transform="capitalize" italic span>
                      {entry.directory}
                    </Text>
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>

              <Accordion.Item value="audio">
                {/* Audio File Information */}
                <Accordion.Control>
                  <Title order={3}>{strings.transcriptions?.card.audio_section_title}</Title>
                </Accordion.Control>
                <Accordion.Panel>
                  {/* Audio File Name  */}
                  <Text weight={700}>
                    {strings.transcriptions?.card.file_name}:{' '}
                    <Text weight={500} transform="capitalize" span>
                      {entry.audioName}
                    </Text>
                  </Text>
                  {/* Audio File Type  */}
                  <Text weight={700}>
                    {strings.transcriptions?.card.file_type}:{' '}
                    <Text weight={500} transform="capitalize" span>
                      {entry.audioFormat}
                    </Text>
                  </Text>
                  {/* Audio File Size  */}
                  <Text weight={700}>
                    {strings.transcriptions?.card.file_length}:{' '}
                    <Text weight={500} transform="capitalize" span>
                      {entry.length
                        ? entry.length < 60
                          ? `${entry.length} ${strings.util.time?.seconds}`
                          : `${Math.floor(entry.length / 60)} ${strings.util.time?.minutes} ${entry.length % 60} ${
                              strings.util.time?.seconds
                            }`
                        : strings.util.status?.unknown}
                    </Text>
                  </Text>
                  {/* Audio File Language  */}
                  <Text weight={700}>
                    {strings.transcriptions?.card.file_language}:{' '}
                    <Text weight={500} transform="capitalize" span>
                      {strings.getString(`languages.${entry.language}`) || entry.language}
                    </Text>
                  </Text>
                </Accordion.Panel>
              </Accordion.Item>
            </Accordion>
          </Stack>
        </Grid.Col>
        <Grid.Col md={6} sm={12}>
          {/* Column containing a preview of the entry */}
          <Text italic color={'dimmed'} lineClamp={15}>
            {entry.transcriptText}
          </Text>
        </Grid.Col>
      </Grid>
      <Divider mt="xs" mb="xs" />
      {buttonBlock(entry)}
      <Divider mt="xs" mb="xs" />
      {progressIndicator(entry)}
    </Card>
  );
}

export default TranscriptionCard;
