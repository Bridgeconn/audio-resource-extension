import * as vscode from 'vscode';
const grammar = require('usfm-grammar');

export async function readUsfm(book: string, resourcePath:vscode.Uri) {
  // Book is \id - GEN in caps

  if (resourcePath) {
    const projectMetadataPath = vscode.Uri.joinPath(
      resourcePath,
      'text-1',
      'ingredients',
      `${book}.usfm`,
    );
    const fileExists = await vscode.workspace.fs.stat(projectMetadataPath).then(
      () => true,
      () => false,
    );
    if (!fileExists) {
      return undefined;
    }

    const usfm = await vscode.workspace.fs.readFile(projectMetadataPath);

    const myUsfmParser = new grammar.USFMParser(
      usfm.toString(),
      grammar.LEVEL.RELAXED,
    );

    const isJsonValid = myUsfmParser.validate();
    if (isJsonValid) {
      const jsonOutput = myUsfmParser.toJSON();
      return jsonOutput.chapters;
    } else {
      vscode.window.showErrorMessage('USFM file is invalid');
      return undefined;
    }
  }
}
