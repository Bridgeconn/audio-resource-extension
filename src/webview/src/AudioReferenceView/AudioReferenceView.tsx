import { useState } from 'react';
import { IChapterdata } from '../../../types/index';
import VerseView from './VerseView';

const chapterContent: IChapterdata = {
  chapterNumber: 1,
  contents: [
    {
      verseNumber: 1,
      verseText: 'Sample test text..... verse 1 of chapter 1....',
      audio: '',
    },
  ],
};
function App() {
  const [scriptDirection, setScriptDirection] = useState<'ltr' | 'rtl'>('ltr');

  return (
    <main className="my-5 flex flex-col gap-y-5">
      {!chapterContent && <>Loading...</>}
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
