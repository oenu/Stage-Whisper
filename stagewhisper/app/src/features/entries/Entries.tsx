import { Stack } from '@mantine/core';
import React from 'react';

// Redux
import { useAppSelector } from '../../redux/hooks';

// Components
import EntryCard from './components/EntryCard';
import { selectActiveEntry, selectEntries } from './entrySlice';

// Localization
import TranscriptionEditor from './components/TranscriptionEditor';

// Component for displaying entry progress / results
function Entries() {
  // Get All Entries
  const entries = useAppSelector(selectEntries);

  // Get Active Transcription (if it exists)
  const activeId = useAppSelector(selectActiveEntry);

  const transcriptionCards = entries.map((entry) => {
    return <EntryCard key={entry.uuid} entry={entry} />;
  });

  console.log(activeId);
  if (activeId === null) {
    return (
      <Stack>
        <Stack spacing="md">{transcriptionCards}</Stack>
      </Stack>
    );
  } else {
    return <TranscriptionEditor active={entries.filter((entry) => entry.uuid === activeId)[0]} />;
  }
}

export default Entries;
