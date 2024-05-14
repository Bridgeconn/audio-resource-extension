import { useState } from 'react';
import Pause from '../Icons/Pause';
import Play from '../Icons/Play';
import Waveform from './Waveform';

interface IAudioPlayer {
  audioURI: string;
  verseNumber: number;
}

function AudioPlayer({ audioURI, verseNumber }: IAudioPlayer) {
  const [control, setControl] = useState<'play' | 'pause' | ''>('');

  return (
    <div
      className="w-[99%] h-7 border border-gray-600 px-2 py-1 self-center
        bg-[var(--vscode-textSeparator-foreground)] flex gap-5 items-center relative"
    >
      {/* Wave */}
      <div className="flex-1 relative">
        {audioURI && (
          <Waveform
            url={audioURI}
            control={control}
            setControl={setControl}
            verseNumber={verseNumber}
          />
        )}
      </div>
      <div>
        {/* button controls */}
        {control === 'play' ? (
          <button
            className={`${audioURI ? 'cursor-pointer' : 'pointer-events-none'}  flex justify-center items-center`}
            onClick={() => setControl('pause')}
            title="Pause"
          >
            <Pause classes="w-6 h-6 fill-blue-500 hover:fill-blue-600" />
          </button>
        ) : (
          <button
            className={`${audioURI ? 'cursor-pointer' : 'pointer-events-none'}  flex justify-center items-center`}
            onClick={() => setControl('play')}
            title="Play"
          >
            <Play
              classes={`w-5 h-5 ${audioURI ? 'stroke-green-400 hover:stroke-green-600' : 'stroke-gray-500 hover:stroke-gray-600 '}`}
            />
          </button>
        )}
      </div>
    </div>
  );
}

export default AudioPlayer;
