import { useEffect, useState } from 'react';
import { IChapterdata } from '../../../types/index';
import { ExttoUIWebMsgTypes } from '../../../types/ExtToUIMsg';
import VerseView from './VerseView';
function App() {
  const [chapterContent, setChapterContent] = useState<IChapterdata | null>(
    null,
  );
  const [scriptDirection, setScriptDirection] = useState<'ltr' | 'rtl'>('ltr');

  useEffect(() => {
    const handleExtensionPostMessages = (event: MessageEvent) => {
      const { type, data } = event.data;
      switch (type) {
        case ExttoUIWebMsgTypes.ChapterData: {
          setChapterContent(data.ChapterData[0]);
          setScriptDirection(data.scriptDirection);
          break;
        }

        default:
          break;
      }
    };

    // add listener for the event
    window.addEventListener('message', handleExtensionPostMessages);

    return () => {
      // clean up event listener
      window.removeEventListener('message', handleExtensionPostMessages);
    };
  }, []);

  return (
    <main className="my-5 flex flex-col gap-y-5">
      {!chapterContent && <>Loading Resource...</>}
      {chapterContent?.contents.map((verseData) => (
        <VerseView
          key={verseData.verseNumber}
          verseData={verseData}
          scriptDirection={scriptDirection}
        />
      ))}
    </main>
  );
}
export default App;
