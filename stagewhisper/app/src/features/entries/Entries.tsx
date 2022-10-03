import { Stack } from '@mantine/core';
import React from 'react';

// Redux
import { useAppSelector } from '../../redux/hooks';

// Components
import TranscriptionCard from './components/EntryCard';
import { selectActiveTranscription, selectTranscriptions } from './entrySlice';

// Localization
import TranscriptionEditor from './components/TranscriptionEditor';

// Component for displaying transcription progress / results
function Transcriptions() {
  // Get All Transcriptions
  const transcriptions = useAppSelector(selectTranscriptions);

  // Get Active Transcription (if it exists)
  const activeId = useAppSelector(selectActiveTranscription);

  const transcriptionCards = transcriptions.map((transcription) => {
    return <TranscriptionCard key={transcription.id} transcription={transcription} />;
  });

  console.log(activeId);
  if (activeId === null) {
    return (
      <Stack>
        <Stack spacing="md">{transcriptionCards}</Stack>
      </Stack>
    );
  } else {
    return <TranscriptionEditor active={transcriptions.filter((transcription) => transcription.id === activeId)[0]} />;
  }
}

export default Transcriptions;
