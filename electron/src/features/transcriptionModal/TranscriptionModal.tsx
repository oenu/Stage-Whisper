import { Alert, Button, Card, Center, Divider, Group, Modal, Select, Stack, Text, Title } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { Entry } from 'knex/types/tables';
import React, { forwardRef, useEffect } from 'react';
import { WhisperArgs, whisperLanguages, whisperModels } from '../../../electron/types/whisperTypes';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { passToWhisper, selectTranscribingStatus } from '../whisper/whisperSlice';

// Models
type model = {
  label: string;
  value: typeof whisperModels[number];
  description: string;
  english: boolean;
};
// Custom select component for the model select
interface ItemProps extends React.ComponentPropsWithoutRef<'div'> {
  // Pass deconstructed model type to the component
  label: string; // What to display in the select dropdown
  description: string; // How to describe the model in the select dropdown
  english: boolean; // Whether the model is exclusively english
}

const SelectItem = forwardRef<HTMLDivElement, ItemProps>(function Item(
  { label, description, english, ...others },
  ref
) {
  return (
    <div ref={ref} {...others}>
      <Text italic size="sm">
        {label}
      </Text>
      <Text italic size="sm">
        {description}
      </Text>
      <Text italic size="sm">
        {english}
      </Text>
    </div>
  );
});

SelectItem.displayName = 'custom-select-item';

/**
 * Transcription Modal Component
 * @param {boolean} open - Whether the modal is open or not
 * @param {function} onClose - Function called when the modal is closed
 * @returns {JSX.Element} Transcription Modal Component
 * @example
 * <TranscriptionModal open={true} onClose={() => {}}></TranscriptionModal>
 * @constructor
 * @see https://mantine.dev/core/modal/
 */

function TranscriptionModal({
  open,
  onClose,
  entry
}: {
  open: boolean;
  onClose: () => void;
  entry: Entry;
}): JSX.Element {
  // Tasks
  // 1. Trigger a transcription for the current entry
  // 1.0. Disable the button while the transcription is in progress
  // 1.0.1 Allow user to select language to transcribe in
  // 1.0.2 Allow user to select transcription model to use
  // 1.1. Show a loading spinner
  // 1.1.1. Show a progress bar
  // 1.2. Show a success message
  // 1.3. Show an error message
  // 2. Show the transcription results
  // 2.1. Prompt the user to open the entry
  // 2.2. Prompt the user to export the transcription

  // Detect mobile view
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Check if an entry is currently being transcribed
  const transcribing = useAppSelector(selectTranscribingStatus);

  // Redux
  const dispatch = useAppDispatch();

  // Languages
  type language = {
    label: string;
    value: string;
    code:  whisperLanguages[number];
  };

  const languages = Object.keys(whisperLanguages).map((language) => {
    return {
      label: language === 'Unknown' ? 'Auto-Detect (Default)' : language,
      value: language,
      code: whisperLanguages[language as keyof typeof whisperLanguages]
    };
  }) as language[];

  const [selectedLanguage, setSelectedLanguage] = React.useState<language>(languages[0]) 

  const models = Object.values(whisperModels).map((model) => {
    // Temporary lookups for model names

    // Check if model ends in .en
    const endsInEn = model.endsWith('.en');
    
    let label: string;
    let description: string;
    switch (
      model // TODO: Replace with strings from localization
    ) {
      case 'tiny.en':
        label = 'Tiny (English Specialized)';
        description = '2x faster than base';
        break;
      case 'base.en':
        label = 'Base (English Specialized)';
        description = 'Default English model';
        break;
      case 'small.en':
        label = 'Small (English Specialized)';
        description = '2.6x slower than base';
        break;
      case 'medium.en':
        label = 'Medium (English Specialized)';
        description = '7.8x slower than base';
        break;
      case 'tiny':
        label = 'Tiny';
        description = '2x faster than base';
        break;
      case 'base':
        label = 'Base';
        description = 'Default model';
        break;
      case 'small':
        label = 'Small';
        description = '2.6x slower than base';
        break;
      case 'medium':
        label = 'Medium';
        description = '7.8x slower than base';
        break;
      case 'large':
        label = 'Large';
        description = '15x slower than base, extreme system requirements';
        break;
    }

    return {
      label,
      value: model,
      description,
      group: endsInEn ? 'English' : 'General',
      english: endsInEn
    };
  }) as model[];
  const [selectedModel, setSelectedModel] = React.useState<model>(models[3]);

  // Detect if a user has selected a model that is only for english and then changed the language to something other than english
  useEffect(() => {
    if (selectedModel.english && selectedLanguage.value !== 'English') {
      // Check if a general model alternative exists
      const generalModel = models.find((model) => model.value === selectedModel.value.replace('.en', ''));
      if (generalModel) {
        setSelectedModel(generalModel);
      } else {
        // If not, select the base model
        setSelectedModel(models[3]);
      }
    }
  }, [selectedLanguage]);

  if (entry) {
    return (
      <Modal
        opened={open}
        onClose={onClose}
        size="xl"
        fullScreen={isMobile}
        title={<Title order={3}>{entry.name}</Title>}
      >
        <Divider />
        {/* Select Language */}
        <Select
          my={'lg'}
          label={'Select Language'}
          searchable
          nothingFound="Not found"
          onChange={(value) => {
            if (value) {
              // Get the language

              const formattedLanguage = languages.find((language) => language.value === value)
              if (formattedLanguage) {
                console.log(formattedLanguage);
                setSelectedLanguage({
                  label: value,
                  value,
                  code: formattedLanguage.code
                });

              } else {
                console.error('TranscriptionModal: Could not find language code for selected language');
              }
            }
          }}
          data={languages}
          value={selectedLanguage.value}
        />
        {selectedLanguage.code !== 'en' && selectedLanguage.code !== 'unknown' && (
          <Alert title="Note" color={'gray'}>
            <Stack>
              Whisper will attempt to translate the selected language to English. Specific languages are better
              supported than others.
              {/* Needs a handler to open in browser rather than in the window */}
              {/* <Button
                onClick={() => {
                  window.open('https://github.com/openai/whisper#available-models-and-languages', '_blank');
                }}
                color="gray"
              >
                Learn more
              </Button> */}
            </Stack>
          </Alert>
        )}
        {selectedLanguage.code == 'unknown' && (
          <Alert color="yellow" title="Auto-Detect Language">
            Whisper will attempt to automatically detect the language of the selected entry from the first 30 seconds of
            audio and then translate it into English. For best results, select the language manually.
          </Alert>
        )}

        {/* Select Model */}
        <Select
          my={'lg'}
          label={'Select Model'}
          searchable
          nothingFound="Not found"
          itemComponent={SelectItem}
          onChange={(value) => {
            if (value) {
              const model = models.find((model) => model.value === value);
              if (model) {
                console.log(model);
                setSelectedModel(model);
              } else {
                console.error('TranscriptionModal: Could not find model for selected model');
              }
            }
          }}
          data={selectedLanguage.code === 'en' ? models : models.filter((model) => !model.english)}
          value={selectedModel.value}
        />
        {selectedModel.value === 'large' && (
          <Alert color="red" title="Large Model">
            The large model is extremely demanding on your system. It is recommended to use a smaller model if possible.
            If your computer has less than 16GB of RAM, it is strongly recommended to use a smaller model.
          </Alert>
        )}

        <Center mt={'xl'}>
          <Button disabled={transcribing.status !== 'idle'} loading={transcribing.status === 'loading'}
            onClick={() => {
              // Check that model and language are compatible
              if (selectedModel.english && selectedLanguage.code !== 'en') {
                return 
              } else {

                // Get the normalized entry
                const normalizedEntry = (await window.Main.GET_ENTRY({ entryUUID: entry.uuid })) as Entry;
if (!normalizedEntry) throw new Error('Entry not found');



dispatch(
  passToWhisper({
    entry: normalizedEntry,
    args:{
      model: selectedModel.value,
      language: selectedLanguage.value,
    }
  })

              }



          >
            <Text>Transcribe</Text>
          </Button>
        </Center>
      </Modal>
    );
  } else {
    return (
      <Modal opened={open} onClose={onClose}>
        <Title>No Entry</Title>
      </Modal>
    );
  }
}

export default TranscriptionModal;
