import { DownloadedResource } from "../../types/codexResource";
import * as vscode from "vscode";

import { ChapterVerseRef, TwlTsvRow } from "./types";
import { fileExists } from "../../utilities";

export const getVerseTranslationWordsList = async (
  resource: DownloadedResource,
  verseRef: string
) => {
  const { bookID, chapter, verse } = extractBookChapterVerse(verseRef);
  if (!vscode.workspace.workspaceFolders?.[0]) {
    console.error("No workspace is open. Please open a workspace.");
    return;
  }
  const resourceDirUri = vscode.Uri.joinPath(
    vscode.workspace.workspaceFolders?.[0].uri as vscode.Uri,
    resource.localPath
  );

  const bookUri = vscode.Uri.joinPath(resourceDirUri, `twl_${bookID}.tsv`);
  const bookContent = await vscode.workspace.fs.readFile(bookUri);

  const bookContentString = bookContent.toString();

  const tsvData = parseTwlTsv(bookContentString);

  const tsvDataWithTwUriPromises = await Promise.allSettled(
    tsvData.map(async (row) => ({
      ...row,
      twUriPath: (
        await convertTwlRCUriToScribeResourceUri(resource, row.TWLink)
      ).path,
    }))
  );

  const TsvDataWithTwUri = tsvDataWithTwUriPromises
    .map((p) => (p.status === "fulfilled" ? p.value : null))
    .filter(Boolean);

  const chapterVerseRef = tsvToChapterVerseRef(
    TsvDataWithTwUri as NonNullable<(typeof TsvDataWithTwUri)[number]>[]
  );

  // Removing the ones which don't have files on the disk
  const wordsWithExistsOnDisk = await Promise.all(
    chapterVerseRef[chapter]?.[verse]?.map(async (word) => ({
      ...word,
      existsOnDisk: await fileExists(
        vscode.Uri.from({ path: word.twUriPath, scheme: "file" })
      ),
    }))
  );

  return wordsWithExistsOnDisk ?? [];
};

export const convertTwlRCUriToScribeResourceUri = async (
  resource: DownloadedResource,
  uri: string = ""
): Promise<vscode.Uri> => {
  const workspaceRootUri = vscode.workspace.workspaceFolders?.[0]
    .uri as vscode.Uri;

  const resourcesUri = vscode.Uri.joinPath(
    workspaceRootUri,
    ".project/resources"
  );

  const twlResourceMetaUri = vscode.Uri.joinPath(
    workspaceRootUri,
    resource.localPath,
    "metadata.json"
  );

  const twlResourceMetaFile = await vscode.workspace.fs.readFile(
    twlResourceMetaUri
  );

  const twlResourceLanguage = JSON.parse(twlResourceMetaFile.toString())?.meta
    ?.language;

  const twResourcesUri = vscode.Uri.joinPath(
    resourcesUri,
    `${twlResourceLanguage}_tw`
  );

  const twPath = uri.replace("rc://*/tw/dict", twResourcesUri.path);

  return vscode.Uri.from({
    scheme: "file",
    path: `${twPath}.md`,
  });
};

export const parseTwlTsv = (tsv: string) => {
  const lines = tsv.split("\n");
  const headers = lines[0].split("\t");
  const data = lines.slice(1).map((line) => line.split("\t"));
  const parsedTsv = data.map((line) => {
    return headers.reduce((acc, header, i) => {
      acc[header] = line[i];
      return acc;
    }, {} as Record<string, string>);
  }) as TwlTsvRow[];

  return parsedTsv;
};

export const tsvToChapterVerseRef = (twlTsv: TwlTsvRow[]) => {
  const chapterVerseRef: ChapterVerseRef = {};
  twlTsv.forEach((row) => {
    const ref = row.Reference;
    const [chapter, verse] = ref.split(":");
    if (!chapterVerseRef[chapter]) {
      chapterVerseRef[chapter] = {};
    }

    // check if a verse is a range
    if (verse?.includes("-")) {
      const [startVerse, endVerse] = verse.split("-").map(Number);
      for (let i = startVerse; i <= endVerse; i++) {
        if (!chapterVerseRef[chapter][i]) {
          chapterVerseRef[chapter][i] = [];
        }
        chapterVerseRef[chapter][i].push(row);
      }
      return;
    }

    if (!chapterVerseRef[chapter][verse]) {
      chapterVerseRef[chapter][verse] = [];
    }

    chapterVerseRef[chapter][verse].push(row);
  });
  return chapterVerseRef;
};

export const extractBookChapterVerse = (
  refString: string
): { bookID: string; chapter: number; verse: number } => {
  const match = refString.match(/([A-Za-z0-9]{3}) (\d+):(\d+)/);

  return match
    ? {
        bookID: match[1],
        chapter: parseInt(match[2], 10),
        verse: parseInt(match[3], 10),
      }
    : { bookID: "GEN", chapter: 1, verse: 1 };
};
