import * as vscode from 'vscode';
import { storageKeys } from '../../types/storageKeys';
import { readUsfm } from '../../utilities/readBook';
import { processTheChapter } from '../../utilities/processchapter';
import { IChapterdata } from '../../types';
import { getNonce } from '../../utilities';
import * as path from 'path';
import { getProjectMeta } from '../../utilities/getMeta';
import { getVersification } from '../../utilities/getVersificationData';
import { ExttoUIWebMsgTypes } from '../../types/ExtToUIMsg';

export class ScribeAudioReference {
  private panel: vscode.WebviewPanel | undefined;
  private static readonly viewType = 'audioReference';
  private readonly globalState: vscode.Memento;
  private readonly currentBC: { bookId: string; chapter: number };
  private loadedUSFMBookContent: Record<string, any>;
  private currentChapterVerses: IChapterdata[] | undefined;
  private resourcePath: vscode.Uri;
  private resourcePathSting: string;
  private metadataJson: any;

  /**
   * Constructor
   */
  constructor(private readonly context: vscode.ExtensionContext) {
    // starting here
    this.globalState = context.workspaceState;
    // TODO : added a fallback for currentBC , for testing too
    this.currentBC = this.getGlobalState(storageKeys.currentBC) || {
      bookId: 'MAT',
      chapter: 1,
    };
    // TODO : Hard coded now , need to change
    this.resourcePath = vscode.Uri.parse(
      '/home/siju/Music/Export Test Vscode/RTL/RTL test',
    );
    this.resourcePathSting = '/home/siju/Music/Export Test Vscode/RTL/RTL test';
    this.loadedUSFMBookContent = {};

    // read metadata
    this._readMeta();

    // Create and configure the webview panel
    this.panel = vscode.window.createWebviewPanel(
      ScribeAudioReference.viewType,
      `${this.currentBC.bookId} - ${this.currentBC.chapter}`, // panel tab title
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.file(path.join(context.extensionPath, 'src')),
          vscode.Uri.file(
            path.join(
              vscode.workspace.workspaceFolders?.[0].uri.fsPath as string,
            ),
          ),
          vscode.Uri.file(path.join(this.resourcePathSting)),
        ],
      },
    );

    // set UI here
    if (this.panel) {

      this.panel.webview.html = this.getHtmlForEditoPanel(this.panel.webview);

      // after panel init
      this.readData(this.currentBC.bookId, this.currentBC.chapter);

      /**
       * Handle recieve message from webview
       */
      this.panel.webview.onDidReceiveMessage(async (e: any) => {
        switch (e.type) {
          case 'test': {
            break;
          }

          default:
            break;
        }
      });
    }

    // Dispose of the panel when it is closed
    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });
  }

  private async _readMeta() {
    this.metadataJson = await getProjectMeta(this.resourcePath);
  }

  /**
   * Send Message or event from EDITOR to Webview
   */
  private postMessage(webview: vscode.Webview, message: any) {
    webview.postMessage(message);
  }

  /**
   * Read the chapter content (USFM and Audio)
   */
  private async readData(book: string, chapter: number) {
    let versificationData;
    // read only once while changing book
    const usfmData =
      this.loadedUSFMBookContent && this.loadedUSFMBookContent[book]
        ? this.loadedUSFMBookContent[book]
        : await readUsfm(book, this.resourcePath);

    if (!usfmData) {
      // read versification
      const versificationJSON: any = await getVersification(this.metadataJson);
      versificationData =
        versificationJSON && versificationJSON.maxVerses[book];
    } else {
      // store parsed data to resue
      if (!this.loadedUSFMBookContent?.[book]) {
        if (!this.loadedUSFMBookContent) {
          this.loadedUSFMBookContent = {};
        }
        this.loadedUSFMBookContent[book] = usfmData;
      }
      // this.updateGlobalState(
      //   storageKeys.loadedUSFMContent,
      //   JSON.stringify(this.loadedUSFMBookContent),
      // );
    }

    const chapterData = await processTheChapter(
      book,
      chapter,
      usfmData,
      versificationData,
      this.resourcePath,
      this.metadataJson,
    );
    this.currentChapterVerses = chapterData;

    // conversion of path to webViewPath
    for (
      let index = 0;
      index < this.currentChapterVerses[0].contents.length;
      index++
    ) {
      const currentAudioUri = this.currentChapterVerses[0].contents[index]
        .audio as unknown as vscode.Uri;

      if (currentAudioUri) {
        const converted = await this.convertToAsWebViewUri(currentAudioUri);

        if (converted) {
          this.currentChapterVerses[0].contents[index].audio = converted;
        }
      }
    }

    if (this.panel?.webview) {
      setTimeout(() => {
        if (this.panel?.webview) {
          this.postMessage(this.panel.webview, {
            type: ExttoUIWebMsgTypes.ChapterData,
            data: {
              ChapterData: this.currentChapterVerses,
              scriptDirection:
                this.metadataJson?.languages?.[0]?.scriptDirection,
            },
          });
        }
      }, 500);
    }
    return chapterData;
  }

  // Method to update the global state
  public updateGlobalState(key: string, value: any) {
    this.globalState.update(key, value);
  }

  // Method to retrieve data from the global state
  public getGlobalState(key: string): any {
    return this.globalState.get(key);
  }

  /**
   * Public method to convert normal file uri to webview uri
   */
  public async convertToAsWebViewUri(url: vscode.Uri) {
    if (this.panel) {
      const webviewUri = this.panel.webview.asWebviewUri(url);
      return webviewUri.toString();
    }
    return undefined;
  }

  // Method to dispose the panel
  public dispose() {
    if (this.panel) {
      this.panel.dispose();
      this.panel = undefined;
    }
  }

  /**
   * Function to get the html of the Webview
   */
  private getHtmlForEditoPanel(webview: vscode.Webview): string {
    // Local path to script and css for the webview
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        'src',
        'webview-dist',
        'AudioReferenceView',
        'index.js',
      ),
    );
    const styleVSCodeUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.context.extensionUri,
        'src',
        'webview-dist',
        'AudioReferenceView',
        'index.css',
      ),
    );

    // Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();

    return /* html */ `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            
            <!-- <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"> -->
            
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            
            <link href="${styleVSCodeUri}" rel="stylesheet" />
            
            <title>Scribe Audio Reference</title>
        </head>
        <body>
            <div id="root"></div>
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>
    `;
  }
}

export let scribeAudioReferenceInstance: ScribeAudioReference | undefined;

export async function initAudioReference(context: vscode.ExtensionContext) {
  if (scribeAudioReferenceInstance) {
    scribeAudioReferenceInstance.dispose();
  }
  scribeAudioReferenceInstance = new ScribeAudioReference(context);
  return scribeAudioReferenceInstance;
}
