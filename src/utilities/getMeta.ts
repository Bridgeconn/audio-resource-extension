import * as vscode from 'vscode';

export async function getProjectMeta(resourcePath: vscode.Uri) {
  const metaUri = vscode.Uri.joinPath(resourcePath, 'metadata.json');

  const metaJson = await vscode.workspace.fs.readFile(metaUri);
  if (!metaJson) {
    vscode.window.showErrorMessage(
      'Audio resource metadata not found. Please open valid audio resource',
    );
    return;
  }

  const parsedMeta = JSON.parse(metaJson.toString());

  if (parsedMeta.type.flavorType.flavor.name !== 'audioTranslation') {
    vscode.window.showErrorMessage('Metadata is not a valid type of audio');
    return;
  }

  return parsedMeta;
}
