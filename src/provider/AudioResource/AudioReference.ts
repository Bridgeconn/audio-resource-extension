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
import { StateStore, initializeStateStore } from '../../utilities/stateStore';
import { extractBookChapterVerse } from '../../utilities/extractVerseRef';
import {
  CodexResource,
  ConfigResourceValues,
} from '@codex-extensions/resource-manager-types';
import { Audio, AudioBurrito } from './types';

export class ScribeAudioReference implements CodexResource<Audio> {
  private panel: vscode.WebviewPanel | undefined;
  private static readonly viewType = 'audioReference';
  private readonly globalState: vscode.Memento;
  private currentBC: { bookId: string; chapter: number };
  private loadedUSFMBookContent: Record<string, any>;
  private currentChapterVerses: IChapterdata[] | undefined;
  private resourcePath: vscode.Uri;
  private resourcePathSting: string;
  private metadataJson: any;
  private resourceName: string;

  id = 'codex.audio';
  displayLabel = 'Audio Resource';

  private globalStoreState:
    | Awaited<ReturnType<typeof initializeStateStore>>
    | undefined;

  /**
   * Constructor
   */
  constructor(private readonly context: vscode.ExtensionContext) {

    // global state extension
    initializeStateStore().then((store) => {
      this.globalStoreState = store;
    });

    // starting here
    this.globalState = context.workspaceState;
    // TODO : added a fallback for currentBC , for testing too
    // this.currentBC = this.getGlobalState(storageKeys.currentBC) || {
    //   bookId: 'MAT',
    //   chapter: 1,
    // };
    this.currentBC = {
      bookId: 'MAT',
      chapter: 5,
    };

    // TODO : Hard coded now , need to change
    this.resourcePath = vscode.Uri.parse(
      '/home/siju/Music/Export Test Vscode/RTL/RTL test',
    );
    this.resourcePathSting = '/home/siju/Music/Export Test Vscode/RTL/RTL test';
    this.resourceName = 'RTL test';
    this.loadedUSFMBookContent = {};

    // read metadata
    this._readMeta();

    // Create and configure the webview panel
    this.panel = vscode.window.createWebviewPanel(
      ScribeAudioReference.viewType,
      // `${this.currentBC.bookId} - ${this.currentBC.chapter}`, // panel tab title
      this.resourceName,
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
      console.log('in panel ))))) ', this.globalStoreState);

      // load ref from global state and load ui content
      initializeStateStore().then((store) => {
        this.globalStoreState = store;
        store.getStoreState('verseRef').then(async (value) => {
          console.log('inside global state get store &&&&&&&&');

          if (value) {
            const { bookID, chapter } = await extractBookChapterVerse(
              value.verseRef,
            );
            this.currentBC = { bookId: bookID, chapter: chapter };
            console.log(
              'load read data after get ref =========> ',
              { bookID, chapter },
              ' ::::  ',
              this.currentBC,
            );

            if (this.panel?.title) {
              this.panel.title = `${this.resourceName} ${bookID}-${chapter}`;
            }

            this.readData(bookID, chapter);
          }
        });
      });

      // after panel init
      // this.readData(this.currentBC.bookId, this.currentBC.chapter);

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

    // INFO : Check listner need or not later. the Reference Provider will dispose and init each call
    // listner for BCV change - global state extension
    const verseRefListenerDisposeFunction =
      this.globalStoreState?.storeListener('verseRef', async (BCVState) => {
        console.log(
          'Book Chapter Changed ------********--------*******---- ',
          BCVState,
        );
        if (BCVState?.verseRef) {
          const { bookID, chapter, verse } = await extractBookChapterVerse(
            BCVState.verseRef,
          );

          this.currentBC = { bookId: bookID, chapter: chapter };
          // call read data to change the reference
          this.readData(bookID.toUpperCase(), chapter);
        }
      });

    // Dispose of the panel when it is closed
    this.panel.onDidDispose(() => {
      this.panel = undefined;
      verseRefListenerDisposeFunction?.();
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

    // conversion of path to webViewPath. Only if have content not []
    if (this.currentChapterVerses.length > 0) {
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

  /**
   * get reference from global state extension
   */
  private async _getReferenceFromGlobal() {
    if (!this.globalState) {
      await initializeStateStore().then((store) => {
        this.globalStoreState = store;
      });
    }
    const verseRef = await this.globalStoreState?.getStoreState('verseRef');
    console.log('_getReferenceFromGlobal  <<<<< : ', verseRef);

    if (verseRef?.verseRef) {
      const { bookID, chapter } = await extractBookChapterVerse(
        verseRef?.verseRef,
      );
      this.currentBC = { bookId: bookID, chapter: chapter };
    }
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

  // ----------- Resoure Manager Funtions ----------
  downloadResource: CodexResource<Audio>['downloadResource'] = async (
    fullResource,
    utils,
  ) => {
    // this is to avoid tsError of function not return ConfigResourceValues
    const configresourceValues = {
      name: '',
      id: '',
      localPath: '',
      remoteUrl: '',
      version: '',
      type: '',
    };
    return Promise.resolve(configresourceValues);
  };

  getResources = async () => {
    return Promise.resolve();
  };

  getResourceById = async () => {
    return Promise.resolve();
  };

  getResourceDisplayData = async () => {
    return Promise.resolve();
  };

  openResource: CodexResource<Audio>['openResource'] = async (
    resource,
    helpers,
  ) => {
    vscode.commands.executeCommand(
      'scribe-audio-resource.openAudioReferencePane',
    );
  };

  getTableDisplayData = async () => {
    return [];
  };

  getOfflineImportMetadata: CodexResource<Audio>['getOfflineImportMetadata'] =
    async (params) => {
      const { fs, resourceUri } = params;

      const metadataUri = vscode.Uri.joinPath(resourceUri, 'metadata.json');

      const metadataFile = await fs.readFile(metadataUri);
      const metadataJson = JSON.parse(metadataFile.toString());
      const metadata = metadataJson as AudioBurrito;
      const primaryKey = Object.keys(metadata.identification.primary);
      const primaryId = Object.keys(
        metadata.identification.primary[primaryKey[0]],
      );
      const revision =
        metadata.identification.primary[primaryKey[0]][primaryId[0]].revision;
      return {
        ...metadata,
        name: metadata?.identification?.name.en,
        id: String(primaryId[0]),
        version: revision,
      };
    };
  getOfflineConfigResourceValues: CodexResource<Audio>['getOfflineConfigResourceValues'] =
    async (params) => {
      const { fs, resourceUri } = params;

      const metadataUri = vscode.Uri.joinPath(resourceUri, 'metadata.json');

      const metadataFile = await fs.readFile(metadataUri);
      const metadataJson = JSON.parse(metadataFile.toString());
      const metadata = metadataJson as AudioBurrito;

      const localPath: string = resourceUri.fsPath;
      const primaryKey = Object.keys(metadata.identification.primary);
      const primaryId = Object.keys(
        metadata.identification.primary[primaryKey[0]],
      );
      const revision =
        metadata.identification.primary[primaryKey[0]][primaryId[0]].revision;
      const downloadedResource: ConfigResourceValues = {
        name: metadata?.identification?.name.en,
        id: String(primaryId[0]),
        localPath: localPath,
        type: this.id,
        remoteUrl: '',
        version: revision,
        // TODO : Ts ignored here => this language will be added in the npm types package later
        // @ts-ignore
        language: metadata.languages[0].tag,
      };

      return downloadedResource;
    };
}

export let scribeAudioReferenceInstance: ScribeAudioReference | undefined;

export async function initAudioReference(context: vscode.ExtensionContext) {
  if (scribeAudioReferenceInstance) {
    scribeAudioReferenceInstance.dispose();
  }
  scribeAudioReferenceInstance = new ScribeAudioReference(context);
  return scribeAudioReferenceInstance;
}
