import { useCallback, useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { formatAudioDuration } from '../utils/formatTime';

interface IWaveformProps {
  url: string;
  control: string;
  setControl: React.Dispatch<React.SetStateAction<'play' | 'pause' | ''>>;
  verseNumber: number;
}

function Waveform({ url, control, setControl, verseNumber }: IWaveformProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [audioPlayBack, setAudioPlayBack] = useState(0);

  /**
   * fetch audio data and load wave
   */
  function fetchAudioFile(audioPath: string) {
    if (audioPath) {
      fetch(audioPath)
        .then((response) => response.arrayBuffer())
        .then((arrayBuffer) => {
          const blob = new Blob([arrayBuffer]);
          const url = URL.createObjectURL(blob);

          wavesurfer.current = WaveSurfer.create({
            container: `#wav-ref-container-${verseNumber}`,
            waveColor: 'rgb(200, 0, 200)',
            progressColor: '#0073E5',
            cursorColor: 'OrangeRed',
            height: 'auto',
            hideScrollbar: true,
            interact: true,
            backend: 'MediaElement',
          });

          // wavesurfer.current?.load("https://www.mfiles.co.uk/mp3-downloads/brahms-st-anthony-chorale-theme-two-pianos.mp3");
          //vscode :  https://file%2B.vscode-resource.vscode-cdn.net/home/siju/Music/Empty%20-%20new%20audio/audio/ingredients/GEN/1/1_1_1_default.mp3
          wavesurfer.current?.load(url);

          wavesurfer.current.on('ready', () => {
            const audioBuffer = wavesurfer?.current?.getDecodedData();
            if (audioBuffer) {
              setAudioPlayBack(audioBuffer.duration);
            }
          });

          wavesurfer.current.on('audioprocess', (time) => {
            setAudioPlayBack(time);
          });

          wavesurfer.current.on('seeking', (time) => {
            setAudioPlayBack(time);
          });
        });
    } else {
      wavesurfer.current?.destroy();
      wavesurfer.current = null;
    }
  }

  // initial load audio
  useEffect(() => {
    setAudioPlayBack(0);
    fetchAudioFile(url);
    return () => {
      wavesurfer.current?.destroy();
    };
  }, [url]);

  const onEndPlay = () => {
    wavesurfer.current && wavesurfer.current.stop();
    setControl('');
  };

  const onPlay = useCallback(() => {
    wavesurfer.current && wavesurfer.current.play();
    wavesurfer.current && wavesurfer.current.on('finish', onEndPlay);
  }, [wavesurfer]);

  const onPause = useCallback(() => {
    wavesurfer.current && wavesurfer.current.pause();
  }, [wavesurfer]);

  const onRewind = useCallback(() => {
    wavesurfer.current && wavesurfer.current.stop();
  }, [wavesurfer]);

  useEffect(() => {
    switch (control) {
      case 'play': {
        onPlay();
        break;
      }
      case 'pause': {
        onPause();
        break;
      }
      case 'rewind': {
        onRewind();
        break;
      }
      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [control]);

  return (
    <div className="flex items-center justify-between w-full gap-3">
      <div
        className="flex-1 h-6 relative"
        ref={containerRef}
        id={`wav-ref-container-${verseNumber}`}
      />
      {/* Duration */}
      <div className="">{formatAudioDuration(audioPlayBack) as string}</div>
    </div>
  );
}

export default Waveform;
