export const extractBookChapterVerse = async (
  refString: string,
): Promise<{ bookID: string; chapter: number; verse: number }> => {
  const match = refString.match(/([A-Za-z0-9]{3}) (\d+):(\d+)/);

  return match
    ? {
        bookID: match[1],
        chapter: parseInt(match[2], 10),
        verse: parseInt(match[3], 10),
      }
    : { bookID: 'MAT', chapter: 1, verse: 1 };
};
