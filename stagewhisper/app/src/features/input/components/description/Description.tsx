import React from 'react';

// Redux
// import { useAppDispatch, useAppSelector } from '../../../../redux/hooks';
// import { selectDirectory, selectHighlightInvalid, setDirectory } from '../../inputSlice';

// Localization
// import strings from '../../../../localization';

// Types
export interface DescriptionType {
  title: string | undefined;
  description: string | undefined;
  date: string | undefined;
  tags: string[] | undefined;
}

function Description() {
  // TODO: #45 Add Description component with fields for name, description, and tags
  // #42, #44
  // Used to input the transcription name, description, tags and notes
  return <div>Description</div>;
}

export default Description;
