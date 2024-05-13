import { Uri } from 'vscode';
import {
  CodexResource,
  ConfigResourceValues,
} from '@codex-extensions/resource-manager-types';
import { Audio, AudioBurrito } from './types';
import moment from 'moment';
import { getNonce, getUri } from '../../utilities';
import { MessageType } from '../../types';
import * as vscode from 'vscode';

export class AudioResource implements CodexResource<Audio> {
  id = 'codex.audio';
  displayLabel = 'Audio Resource';

  constructor(private readonly context: vscode.ExtensionContext) {}
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
    helpers.renderInWebview({
      handler: (webviewPanel) => {
        webviewPanel.webview.onDidReceiveMessage((e) =>
          handleResourceWebviewMessages(e, webviewPanel.webview.postMessage),
        );
      },
      getWebviewContent: (webview, extensionUri) => {
        
      },
      onWebviewVisible: async (webviewPanel) => {
        helpers.stateStore.storeListener('verseRef', async (verseRefStore) => {
          console.log('verseRef change event triggered from storeListener ===');
          /**
           * Here need to handle post data to UI when verse / chapter change
           */
          // webviewPanel.webview.postMessage({
          //   type: 'update-twl',
          //   payload: {
          //     wordsList: wordsList,
          //   },
          // });
        });
        const verseRefStore = (await helpers.stateStore?.getStoreState(
          'verseRef',
        )) as { verseRef: any };
        console.log(
          'current verse selction ========> ',
          verseRefStore?.verseRef,
        );

        // webviewPanel.webview.postMessage({

        //   type: 'update-twl',
        //   payload: {
        //     wordsList: wordsList,
        //   },
        // });
      },
    });
  };

  // openResource: CodexResource<Audio>['openResource'] = async (
  //   resource,
  //   helpers,
  // ) => {
  //   helpers.renderInWebview({
  //     handler: (webviewPanel) => {
  //       webviewPanel.webview.onDidReceiveMessage((e) =>
  //         handleResourceWebviewMessages(e, webviewPanel.webview.postMessage),
  //       );
  //     },
  //     getWebviewContent: (webview, extensionUri) => {
  //       // The CSS file from the React build output
  //       // const stylesUri = getUri(webview, this.context.extensionUri, [
  //       //   'src',
  //       //   'webview-dist',
  //       //   'AudioReferenceView',
  //       //   'index.css',
  //       // ]);
  //       // console.log('script1', { webview }, this.context.extensionUri);

  //       // // The View JS file from the React build output
  //       // const scriptUri = getUri(webview, this.context.extensionUri, [
  //       //   'src',
  //       //   'webview-dist',
  //       //   'AudioReferenceView',
  //       //   'index.js',
  //       // ]);
  //       // console.log('script', scriptUri);
  //       // const codiconsUri = getUri(webview, this.context.extensionUri, [
  //       //   'node_modules',
  //       //   '@vscode/codicons',
  //       //   'dist',
  //       //   'codicon.css',
  //       // ]);

  //       const scriptUri = webview.asWebviewUri(
  //         vscode.Uri.joinPath(
  //           this.context.extensionUri,
  //           'src',
  //           'webview-dist',
  //           'AudioReferenceView',
  //           'index.js',
  //         ),
  //       );
  //       const stylesUri = webview.asWebviewUri(
  //         vscode.Uri.joinPath(
  //           this.context.extensionUri,
  //           'src',
  //           'webview-dist',
  //           'AudioReferenceView',
  //           'index.css',
  //         ),
  //       );
  //       // <!--link rel="stylesheet" type="text/css" href="${codiconsUri}"-->

  //       const nonce = getNonce();

  //       // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
  //       return /*html*/ `
  //     <!DOCTYPE html>
  //     <html lang="en">
  //       <head>
  //         <meta charset="UTF-8" />
  //         <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  //         <!-- <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} blob:; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"> -->
  //         <link rel="stylesheet" type="text/css" href="${stylesUri}">
  //         <title>Scribe Audio Resource</title>
  //       </head>
  //       <body>
  //         <div id="root"></div>
  //         <script nonce="${nonce}" src="${scriptUri}"></script>
  //       </body>
  //     </html>`;
  //     },
  //     onWebviewVisible: async (webviewPanel) => {
  //       helpers.stateStore.storeListener('verseRef', async (verseRefStore) => {
  //         console.log('verseRef change event triggered from storeListener ===');
  //         /**
  //          * Here need to handle post data to UI when verse / chapter change
  //          */
  //         // webviewPanel.webview.postMessage({
  //         //   type: 'update-twl',
  //         //   payload: {
  //         //     wordsList: wordsList,
  //         //   },
  //         // });
  //       });
  //       const verseRefStore = (await helpers.stateStore?.getStoreState(
  //         'verseRef',
  //       )) as { verseRef: any };
  //       console.log(
  //         'current verse selction ========> ',
  //         verseRefStore?.verseRef,
  //       );

  //       // webviewPanel.webview.postMessage({

  //       //   type: 'update-twl',
  //       //   payload: {
  //       //     wordsList: wordsList,
  //       //   },
  //       // });
  //     },
  //   });
  // };

  /**
   * This func is for return structured data to display online resource to list out and download
   * @returns
   */
  //TODO : Typescript fix needed here -> ignored
  // @ts-ignore
  getTableDisplayData = async () => {
    // Read config
    // const resourceUrl = `https://git.door43.org/api/v1/catalog/search?subject=TSV Translation Words Links&metadataType=rc`;

    // const response = await fetch(resourceUrl);

    // const responseJson = (await response.json()) as TwlApiResponse;

    // if (responseJson?.data) {
    //   return responseJson.data.map((resource) => ({
    //     id: resource.id.toString(),
    //     name: resource.name,
    //     owner: {
    //       name: resource.repo.owner.full_name,
    //       url: resource.repo.owner.website,
    //       avatarUrl: resource.repo.owner.avatar_url,
    //     },
    //     version: {
    //       tag: resource.release.tag_name,
    //       releaseDate: new Date(resource.released),
    //     },
    //     fullResource: resource,
    //     resourceType: this.id,
    //   }));
    // }
    return [
      {
        id: '42716',
        name: 'audio_dummy',
        owner: {
          name: 'bcs',
          url: '',
          avatarUrl: '',
        },
        version: {
          tag: 'v1',
          releaseDate: new Date(),
        },
        fullResource: {},
        resourceType: this.id,
      },
    ];
    // return [];
  };

  getOfflineImportMetadata: CodexResource<Audio>['getOfflineImportMetadata'] =
    async (params) => {
      const { fs, resourceUri } = params;

      const metadataUri = Uri.joinPath(resourceUri, 'metadata.json');

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

      const metadataUri = Uri.joinPath(resourceUri, 'metadata.json');

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

const handleResourceWebviewMessages = async (
  e: {
    type: MessageType;
    payload: unknown;
  },
  postWebviewMessage: (message: any) => void,
) => {
  switch (e.type) {
    case MessageType.GET_TW_CONTENT: {
      try {
        const translationWord: {
          path: string;
        } = (e.payload as Record<string, any>)?.translationWord;

        if (!translationWord) {
          return;
        }

        const path = translationWord.path;

        if (!path) {
          return;
        }

        try {
          const content = await vscode.workspace.fs.readFile(
            vscode.Uri.file(path),
          );
          postWebviewMessage({
            type: 'update-tw-content',
            payload: {
              content: content.toString(),
            },
          });
        } catch (e: any) {
          postWebviewMessage({
            type: 'update-tw-content',
            payload: {
              error: e?.message,
              content: null,
            },
          });
        }
      } catch (error: any) {
        vscode.window.showErrorMessage(
          'Unable to read the given translation word: ' + error?.message,
        );
        postWebviewMessage({
          type: 'update-tw-content',
          payload: {
            error: 'Not found',
          },
        });
      }
      break;
    }
    default: {
      break;
    }
  }
};
