import { Button, Card, Center, Divider, Grid, Group, Loader, Stack, Text, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { IconFileCheck, IconFileDescription } from '@tabler/icons';
import React from 'react';
import { useNavigate } from 'react-router-dom';

// Redux

import { entry } from '../../../../electron/types/types';

// Localization

import strings from '../../../localization';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { passToWhisper, selectTranscribingStatus } from '../../whisper/whisperSlice';
import { setActiveEntry } from '../entrySlice';

function TranscriptionCard({ entry }: { entry: entry }) {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  // may not be the same as the entry passed into this component
  const transcribing = useAppSelector(selectTranscribingStatus);

  // Detect mobile view
  const isMobile = useMediaQuery('(max-width: 600px)');

  const buttons =
    entry.transcriptions.length > 0 ? (
      // Has transcriptions
      <>
        <Button
          onClick={() => {
            navigate(`/entries/${entry.config.uuid}`);
          }}
          color="green"
          variant="outline"
        >
          {strings.util.buttons?.export}
        </Button>
        <Button
          onClick={() => {
            navigate(`/entries/${entry.config.uuid}`);
          }}
          color="primary"
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
          color="violet"
          variant="outline"
          disabled={transcribing.status === 'loading'}
        >
          {strings.util.buttons?.transcribe}
        </Button>
        {transcribing.status === 'loading' && transcribing.entry?.config.uuid === entry.config.uuid ? (
          // Cancel button
          <Button
            onClick={() => {
              console.log('Cancel');
            }}
            color="red"
            variant="outline"
            disabled={transcribing.status === 'loading' && transcribing.entry?.config.uuid !== entry.config.uuid}
          >
            {strings.util.buttons?.cancel}
          </Button>
        ) : (
          // Delete button
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
        )}
      </>
    );

  const icon =
    transcribing?.entry?.config.uuid === entry.config.uuid ? (
      <Loader /> // If the entry is currently being transcribed, show a loading icon
    ) : entry.transcriptions.length > 0 ? (
      <IconFileCheck color={'green'} size={40} />
    ) : (
      // If the entry has no transcriptions, show a
      <IconFileDescription size={40} /> // If the entry has transcriptions, show a file description icon
    );

  // Main Card Content
  const content = (
    <Card withBorder>
      <Grid grow align={'center'}>
        <Grid.Col span={isMobile ? 12 : 8} style={{ height: '100%' }}>
          <Stack justify={'center'}>
            <Group>
              {icon}
              {/* Loader */}

              {/* Title */}
              <Stack>
                <Text
                  size={'lg'}
                  weight={700}
                  style={{ textOverflow: 'ellipsis', wordBreak: 'break-all', overflow: 'hidden' }}
                >
                  {entry.config.name}
                </Text>
                {/* Added */}

                <Text span weight={500}>
                  {new Date(entry.config.created).toDateString()} -{' '}
                  {new Date(entry.config.created).toLocaleTimeString()}
                </Text>
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