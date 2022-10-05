import React, { useState } from 'react';

const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

// Calls main process to get audio file, returned in format Uint8Array that can be recomposed into an audio file
const handleAudioUint8Array = async (filePath: string) => {
  window.Main.fetchAudioFile(filePath).then((audio) => {
    const audioBlob = new Blob([audio], { type: 'audio/mp3' });
    setAudioBlob(audioBlob);
  });
};

function AudioPlayer(filePath: string) {
  if (filePath) {
    handleAudioUint8Array(filePath);
  }

  return (
    <div>
      {audioBlob && (
        <audio controls>
          <source src={URL.createObjectURL(audioBlob)} type="audio/mp3" />
        </audio>
      )}
    </div>
  );
}

export default AudioPlayer;
