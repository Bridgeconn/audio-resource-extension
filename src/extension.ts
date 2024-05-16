// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { AudioResource } from './provider/AudioResource/provider';
import { initAudioReference } from './provider/AudioResource/AudioReference';
import { StateStore, initializeStateStore } from './utilities/stateStore';

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

  const extension = vscode.extensions.getExtension(
    'sevenx-codex.codex-resources',
  );
  if (extension) {
    console.log('Test extension');
    const api = await extension.activate();
    if (api) {
      console.log('Api found', api);
      const currentInstance = await initAudioReference(context);
      api.registerResource(currentInstance);
      // api.registerResource(new AudioResource(context));
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

  /**
   * Register Audio Editor
   */
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'scribe-audio-resource.openAudioReferencePane',
      async () => {
        // TODO : Need to checl multi instances create issue or not
        await initAudioReference(context);
      },
    ),
  );

  /**
   * Command to change the Reference
   * this is for dev mode
   */
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'scribe-audio-resource.changeBCReference',
      async () => {
        // get the user data for reference
        // format of reference is BOOKID ch:verse
        const bcRef = await vscode.window.showInputBox({
          prompt: 'Enter Reference',
          placeHolder: 'Add like the same as exmaple here - MAT 1:1',
        });
        if (!bcRef) {
          return;
        }

        // if (!/\w{3}\s[1-9]:[1-9][0-9]{1,2}/.test(bcRef)) {
        if (!/([A-Za-z0-9]{3}) (\d+):(\d+)/.test(bcRef)) {
          // wrong format
          vscode.window.showErrorMessage(
            'Entered Reference is not in the correct format. BOOKID CHAPTER:VERSE ( MAT 1:1 )',
          );
          return;
        }

        console.log('bcsref========> ', bcRef);

        // update to store state global
        initializeStateStore()
          .then(({ updateStoreState }) => {
            updateStoreState({
              key: 'verseRef',
              value: { verseRef: bcRef, uri: '' },
            });
          })
          .then(() => {
            // vscode.commands.executeCommand(
            //   'scribe-audio-resource.openAudioReferencePane',
            // );
            console.log('updated reerence >>>>>>>>>>>>');
          });
      },
    ),
  );
}

// This method is called when your extension is deactivated
export function deactivate() {}
