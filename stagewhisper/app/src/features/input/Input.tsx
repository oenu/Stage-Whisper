import { SimpleGrid, Center, Button, Alert, Stack, Title } from '@mantine/core';
import React from 'react';

// Components
import Language from './components/language/Language';
// import Model from './components/model/Model';
import Audio, { AudioType } from './components/audio/Audio';

// Redux
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import {
  resetInput,
  selectAbout,
  selectAudio,
  selectLanguage,
  // selectModel,
  selectSubmittingState,
  setHighlightInvalid
} from './inputSlice';

// Localization
import strings from '../../localization';
import { WhisperArgs } from '../../../electron/whisperTypes';
import { useNavigate } from 'react-router-dom';
import { getLocalFiles } from '../entries/entrySlice';
import About from './components/about/About';

function Input() {
  // Redux
  const dispatch = useAppDispatch();
  const { audio } = useAppSelector(selectAudio);
  const { language } = useAppSelector(selectLanguage);
  const { about } = useAppSelector(selectAbout);
  const navigate = useNavigate();
  // const { model } = useAppSelector(selectModel);

  const { submitting, error, submitted } = useAppSelector(selectSubmittingState);

  // On page load reset inputs to default
  React.useEffect(() => {
    dispatch(setHighlightInvalid(false));
  }, []);

  const handleNewEntry = async ({
    audio,
    language,
    name,
    tags
  }: {
    audio: AudioType;
    language: WhisperArgs['language'];
    name: string;
    tags: string[];
  }) => {
    if (audio.path && audio.name && language && name && tags) {
      console.log('Input: All selections made');
      dispatch(setHighlightInvalid(false));
      await window.Main.newEntry({
        filePath: audio.path,
        audio: {
          name: audio.name,
          type: audio.type || audio.path.split('.').pop() || 'unknown',
          language: language
        },
        config: {
          name: audio.name, // FIXME: #42 Get title from user
          description: 'Placeholder description', // FIXME:  Get description from user
          tags: ['Placeholder', 'tags'] // FIXME: #44 Get tags from user
        }
      })
        .then((result) => {
          // If the submission was successful
          if (result) {
            console.log('New entry created', result);
            // Reset form
            console.log('Resetting form');
            dispatch(resetInput());
            console.log('Getting local files');
            dispatch(getLocalFiles());
            navigate('/entries');
          }
        })
        .catch((error) => {
          // If the submission failed
          console.log('Error creating new entry: ' + error);
        });
    } else {
      dispatch(setHighlightInvalid(true));
    }
  };

  return (
    <Center>
      {/* <SimpleGrid cols={2} breakpoints={[{ maxWidth: 900, cols: 1, spacing: 'sm' }]}> */}
      <Stack style={{ maxWidth: 1000 }}>
        <Title order={3}>{strings.input?.title}</Title>
        <Title italic order={5}>
          {strings.input?.prompt}
        </Title>
        <About />
        <Audio />
        <Language />

        {/* <Model /> */}
        {/* </SimpleGrid> */}

        <Center my="lg">
          {/* Error Alert */}
          <Stack>
            <Alert color="red" hidden={!error} title={strings.util.error}>
              {error || strings.util.unknownError}
            </Alert>

            <Button
              onClick={async () => {
                console.log('Input values: ' + language, audio);
                if (window.Main) {
                  handleNewEntry({
                    language,
                    audio,
                    name: about.name // FIXME: #42 Create entry title input component
                    tags: ['placeholder', 'tags'] // FIXME: #44 Create tag input component
                  });
                } else {
                  // eslint-disable-next-line no-alert
                  alert(
                    'window.Main is undefined, app in dev mode, please view in electron to select an output directory'
                  );
                }
              }}
            >
              {strings.input?.submit_button}
            </Button>
          </Stack>
        </Center>
      </Stack>
    </Center>
  );
}

export default Input;
