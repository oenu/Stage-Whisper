import React, { useState } from 'react';

const [audioBuffer, setAudioBuffer] = useState<Blob | null>(null);

// Calls main process to get audio file, returned in format Uint8Array that can be recomposed into an audio file
const handleAudioUint8Array = async (filePath: string) => {
  window.Main.fetchAudioFile(filePath).then((audio) => {
    const audioBlob = new Blob([audio], { type: 'audio/mp3' });
    setAudioBuffer(audioBlob);
  });
};

function AudioPlayer() {
  return (
    <div>
      {audioBuffer && (
        <audio controls>
          <source src={URL.createObjectURL(audioBuffer)} type="audio/mp3" />
        </audio>
      )}
    </div>
  );
}

export default AudioPlayer;
