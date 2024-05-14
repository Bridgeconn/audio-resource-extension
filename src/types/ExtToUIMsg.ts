// Types for messages shared from Extension to UI
import { IVerseData, IChapterdata } from '.';

export enum ExttoUIWebMsgTypes {
  ChapterData = 'Reference Chapter Data of IChapterdata',
}

type ExtToEditorMsgDataType = ExttoUIWebMsgTypes.ChapterData;
