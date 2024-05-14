import * as vscode from 'vscode';

export async function getAudioBlob(
  resourceChapterPath: vscode.Uri,
  chapter: number,
) {
  const audioFiles =
    await vscode.workspace.fs.readDirectory(resourceChapterPath);

  const audios: Record<string, vscode.Uri> = {};
  audioFiles.forEach(async (file) => {
    const fileName = file[0];
    const url = fileName.split('.');
    const verseNum = url[0].split('_'); // verseNum[chapter, verse, takes(optional), default(optional)]
    if (!(verseNum[1] in audios)) {
      // if opening project is not exported  -> project diretory (only read default) => 1__1_1_default.wav
      if (verseNum.length > 2) {
        // only take default audios
        if (verseNum.includes('default')) {
          audios[verseNum[1]] = vscode.Uri.joinPath(
            resourceChapterPath,
            fileName,
          );
        }
      } else {
        // exported audio project => 1_1.wav
        audios[verseNum[1]] = vscode.Uri.joinPath(
          resourceChapterPath,
          fileName,
        );
      }
    }
  });
  return audios;
}

export async function processTheChapter(
  book: string,
  chapter: number,
  usfmData: any,
  versifcationData: string[],
  resourceDir: vscode.Uri,
  metadataJson: any,
) {
  /**
   * There are two variation of path in ingredients
   * get the ingredinets path from metadata
   * v1 => ingredients/BookId/Chapter/1_1.mp3
   * v2 => audio/ingredients/BOOKId/Chapter/1_1_1_default.wav
   */

  const currentBookPath = Object.keys(metadataJson.ingredients).find((key) =>
    key.includes(book),
  );
  const audioFilesPath = currentBookPath?.split(book)[0];
  let audioExtension: any = currentBookPath?.split('.');
  audioExtension = audioExtension?.[audioExtension.length - 1];

  // generate path to the requested chapter
  const chapterPath = vscode.Uri.joinPath(
    resourceDir,
    audioFilesPath as string,
    book,
    chapter.toString(),
  );
  // check the chapter is exist or not
  const chapterExist = await vscode.workspace.fs.stat(chapterPath).then(
    () => true,
    () => false,
  );

  let audioData: Record<string, vscode.Uri> = {};
  if (chapterExist) {
    audioData = await getAudioBlob(chapterPath, chapter);
  }

  let bookContent = [];
  if (usfmData) {
    const chapterContent = usfmData.find((obj: any) => {
      return parseInt(obj.chapterNumber, 10) === chapter;
    });

    let contents: { verseNumber: number; verseText: string; audio: any }[] = [];
    let verses: { verseNumber: number; verseText: string; audio: any }[] = [];
    // audio for chapter intro - only available from v2
    verses.push({
      verseNumber: 0,
      verseText: 'Chapter Intro',
      // audio: '',
      audio: chapterExist && '0' in audioData ? audioData['0'] : '',
    });
    for (let v = 1; v <= chapterContent.contents.length; v += 1) {
      if (chapterContent.contents[v]?.verseNumber) {
        verses.push({
          verseNumber: parseInt(chapterContent.contents[v]?.verseNumber, 10),
          verseText: chapterContent.contents[v]?.verseText,
          audio:
            chapterExist && chapterContent.contents[v]?.verseNumber
              ? audioData[chapterContent.contents[v]?.verseNumber]
              : '',
        });
      }
    }
    contents = contents.concat(verses);
    bookContent.push({
      chapterNumber: chapter,
      contents,
    });
  } else {
    let contents: { verseNumber: number; verseText: string; audio: any }[] = [];
    let verses: { verseNumber: number; verseText: string; audio: any }[] = [];
    verses.push({
      verseNumber: 0,
      verseText: 'Chapter Intro',
      audio: chapterExist && '0' in audioData ? audioData['0'] : '',
    });
    for (let v = 1; v <= parseInt(versifcationData[chapter - 1], 10); v += 1) {
      verses.push({
        verseNumber: v,
        verseText: '',
        audio:
          chapter && v.toString() in audioData ? audioData[v.toString()] : '',
      });
    }
    contents = contents.concat(verses);
    bookContent.push({
      chapterNumber: chapter,
      contents,
    });
  }

  return bookContent;
}
