import { IVerseData } from '../../../types/index';
import AudioPlayer from './AudioPlayer';

interface IVerseView {
  verseData: IVerseData;
  //   selectedVerse: number | null;
  //   setSelectedVerse: React.Dispatch<React.SetStateAction<number | null>>;
  scriptDirection: 'ltr' | 'rtl' | undefined;
}

function VerseView({ verseData, scriptDirection }: IVerseView) {
  return (
    <div
      className={`flex gap-2 items-center relative ${scriptDirection === 'rtl' && 'flex-row-reverse'}`}
    >
      {/* verse num */}
      {verseData.verseNumber > 0 && (
        <div className="p-2 w-6 h-6 rounded-full border border-gray-600 flex justify-center items-center">
          {verseData.verseNumber}
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {/* verse content */}
        <div
          className={`border rounded-md w-full px-2 py-3  min-h-10 border-gray-600
        `}
        >
          <div
            className={`flex flex-col gap-2 ${scriptDirection === 'rtl' && 'flex-row-reverse text-end'}`}
          >
            <div className="flex-1">{verseData.verseText}</div>
            <div className="flex-1 relative">
              <AudioPlayer audioURI={verseData?.audio} verseNumber={verseData.verseNumber}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerseView;
