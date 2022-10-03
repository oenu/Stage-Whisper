import { Card, Stack, TextInput, Title } from '@mantine/core';
import React from 'react';
import strings from '../../../../localization';
import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
import { selectAbout, selectHighlightInvalid, setAbout } from '../../inputSlice';

// Redux
// import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
// import { selectDirectory, selectHighlightInvalid, setDirectory } from '../../inputSlice';

// Localization
// import strings from '../../../../localization';

// Types
export interface AboutType {
  title: string;
  description: string | undefined;
  tags: string[] | undefined;
}

function About() {
  // TODO: #45 Add Description component with fields for name, description, and tags
  // #42, #44
  // Used to input the transcription name, description, tags and notes
  // Redux
  const dispatch = useAppDispatch();
  const { aboutValid, about } = useAppSelector(selectAbout);
  const highlightInvalid = useAppSelector(selectHighlightInvalid);

  return (
    <Card shadow="xs" p="md" withBorder title="Audio">
      <Stack>
        <Title order={4}>{strings.input?.about?.title}</Title>
        {/* Name of the entry */}
        <TextInput
          error={aboutValid && highlightInvalid && !about?.title}
          placeholder={strings.input?.about?.title.placeholder}
          label={strings.input?.about?.title.prompt}
          value={about.title}
          onChange={(e) => {
            dispatch(setAbout({ ...about, title: e.currentTarget.value }));
          }}
        />
        {/* Description of the entry */}
        <TextInput
          error={aboutValid && highlightInvalid && !about?.description}
          placeholder={strings.input?.about?.description.placeholder}
          label={strings.input?.about?.description.prompt}
          value={about.description}
          onChange={(e) => {
            dispatch(setAbout({ ...about, description: e.currentTarget.value }));
          }}
        />
        {/* Tags for the entry */}
        <TextInput
          placeholder={strings.input?.about?.tags.placeholder}
          label={strings.input?.about?.tags.prompt}
          value={about.tags?.join(', ')}
          onChange={(e) => {
            dispatch(setAbout({ ...about, tags: e.currentTarget.value.split(', ') }));
          }}
        />
      </Stack>
    </Card>
  );
}

export default About;
