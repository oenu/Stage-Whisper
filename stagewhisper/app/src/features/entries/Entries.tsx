import { Center, Stack } from '@mantine/core';
import React from 'react';

// Redux
import { useAppSelector } from '../../redux/hooks';

// Components
import EntryCard from './components/EntryCard';
import { selectActiveEntry, selectEntries } from './entrySlice';

// Localization
import EntryEditor from './components/EntryEditor';

// Component for displaying entry progress / results
function Entries() {
  // Get All Entries
  const entries = useAppSelector(selectEntries);

  // Get Active Entry (if it exists)
  const activeId = useAppSelector(selectActiveEntry);

  const entryCards = entries.map((entry) => {
    return <EntryCard key={entry.config.uuid} entry={entry} />;
  });

  // If there is an active entry, display the entry editor
  if (activeId === null) {
    return (
      <Center>
        <Stack style={{ width: '100%', maxWidth: 1100 }} spacing="md">
          {entryCards}
        </Stack>
      </Center>
    );
  } else {
    // If there is no active entry, display the entries list
    return <EntryEditor active={entries.filter((entry) => entry.config.uuid === activeId)[0]} />;
  }
}

export default Entries;
