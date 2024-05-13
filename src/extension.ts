// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AudioResource } from './provider/AudioResource/provider';
import { getWebviewContentResource } from './provider/AudioResource/AudioWebView';
import * as path from 'path';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "scribe-audio-resource" is now active!',
  );

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  let disposable = vscode.commands.registerCommand(
    'scribe-audio-resource.helloWorld',
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage('Hello World from .!');
    },
  );

  context.subscriptions.push(disposable);
  console.log('Test1');

  const extension = vscode.extensions.getExtension(
    'sevenx-codex.codex-resources',
  );
  if (extension) {
    console.log('Test extension');
    const api = await extension.activate();
    if (api) {
      console.log('Api found', api);
      api.registerResource(new AudioResource(context));
    } else {
      console.log('API failed successfully!!!!!');
    }
  } else {
    console.log('Not working');
  }

  /**
   * Test implementation of webvie for current loading ==================
   * this is used until the issue fixed with resource manger
   */
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'scribe-audio-resource.openAudioReferencePane',
      async () => {
        const panel = vscode.window.createWebviewPanel(
          'audioreerence',
          'Audio Reference',
          vscode.ViewColumn.One,
          {
            enableScripts: true,
            localResourceRoots: [
              vscode.Uri.file(path.join(context.extensionPath, 'src')),
              vscode.Uri.file(
                path.join(
                  vscode.workspace.workspaceFolders?.[0].uri.fsPath as string,
                ),
              ),
            ],
          },
        );
        panel.webview.html = await getWebviewContentResource(
          panel.webview,
          context,
        );
      },
    ),
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
