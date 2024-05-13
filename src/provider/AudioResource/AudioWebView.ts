import * as vscode from 'vscode';
import { getNonce } from '../../utilities';

// export function activate(context: vscode.ExtensionContext) {
//   context.subscriptions.push(
//     vscode.commands.registerCommand('extension.showWebView', async () => {
//       // Create and show a new webview
//       const panel = vscode.window.createWebviewPanel(
//         'myWebview', // Identifies the type of the webview. Used internally
//         'My WebView', // Title of the panel displayed to the user
//         vscode.ViewColumn.One, // Editor column to show the new webview panel in.
//         {}, // Webview options. More on these later.
//       );

//       // And set its HTML content

//       panel.webview.html = await getWebviewContentResource(panel.webview, context);
//     }),
//   );
// }

/**
 * Testing function for to provide webview content
 */
export const getWebviewContentResource = async (
  webview: vscode.Webview,
  context: vscode.ExtensionContext,
) => {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(
      context.extensionUri,
      'src',
      'webview-dist',
      'AudioReferenceView',
      'index.js',
    ),
  );
  const stylesUri = webview.asWebviewUri(
    vscode.Uri.joinPath(
      context.extensionUri,
      'src',
      'webview-dist',
      'AudioReferenceView',
      'index.css',
    ),
  );
  // <!--link rel="stylesheet" type="text/css" href="${codiconsUri}"-->

  const nonce = getNonce();

  // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
  return /*html*/ `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <!-- <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"> -->
            <link rel="stylesheet" type="text/css" href="${stylesUri}">
            <title>Scribe Audio Resource</title>
          </head>
          <body>
            <div id="root"></div>
            <script nonce="${nonce}" src="${scriptUri}"></script>
          </body>
        </html>`;
};

// function getWebviewContent() {
//   return `<!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>My WebView</title>
// </head>
// <body>
//     <h1>Hello, World!</h1>
// </body>
// </html>`;
// }
