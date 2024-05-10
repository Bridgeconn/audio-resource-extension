import { Uri } from 'vscode';
import {
  CodexResource,
  ConfigResourceValues,
} from '@codex-extensions/resource-manager-types';
import { Twl, TwlApiResponse } from './types';
import moment from 'moment';
import JSZip from 'jszip';
import { getNonce, getUri } from '../../utilities';
import { MessageType } from '../../types';
import * as vscode from 'vscode';
import { getVerseTranslationWordsList } from './utils';
export class AudioResource implements CodexResource<Twl> {
  id = 'codex.audio';
  displayLabel = 'Audio Resource';

  constructor(private readonly context: vscode.ExtensionContext) {}
  downloadResource: CodexResource<Twl>['downloadResource'] = async () => {
    return Promise.resolve();
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

  openResource: CodexResource<Twl>['openResource'] = async (
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
        // The CSS file from the React build output
        const stylesUri = getUri(webview, this.context.extensionUri, [
          'src',
          'webview-dist',
          'AudioReferenceView',
          'index.css',
        ]);
        console.log('script1', { webview }, this.context.extensionUri);

        // The View JS file from the React build output
        const scriptUri = getUri(webview, this.context.extensionUri, [
          'src',
          'webview-dist',
          'AudioReferenceView',
          'index.js',
        ]);
        console.log('script', scriptUri);
        const codiconsUri = getUri(webview, this.context.extensionUri, [
          'node_modules',
          '@vscode/codicons',
          'dist',
          'codicon.css',
        ]);

        const nonce = getNonce();

        // Tip: Install the es6-string-html VS Code extension to enable code highlighting below
        return /*html*/ `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <!-- <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';"> -->
          <link rel="stylesheet" type="text/css" href="${stylesUri}">
            <link rel="stylesheet" type="text/css" href="${codiconsUri}">
          <title>Translation Words Webview</title>
        </head>
        <body>
          <h1>Hello Testing now</h1>
          <div id="root"></div>
          <script type="module" nonce="${nonce}" src="${scriptUri}"></script>
        </body>
      </html>`;
      },
      onWebviewVisible: async (webviewPanel) => {
        helpers.stateStore.storeListener('verseRef', async (verseRefStore) => {
          console.log('Opening TWL resource on verseRef change');
          const wordsList = await getVerseTranslationWordsList(
            resource,
            verseRefStore?.verseRef ?? 'GEN 1:1',
          );
          webviewPanel.webview.postMessage({
            type: 'update-twl',
            payload: {
              wordsList: wordsList,
            },
          });
        });
        const verseRefStore = await helpers.stateStore?.getStoreState(
          'verseRef',
        );
        console.log('Opening TWL resource', verseRefStore?.verseRef);
        const wordsList = await getVerseTranslationWordsList(
          resource,
          verseRefStore?.verseRef ?? 'GEN 1:1',
        );

        console.log('TWL wordsList', wordsList);

        webviewPanel.webview.postMessage({
          type: 'update-twl',
          payload: {
            wordsList: wordsList,
          },
        });
      },
    });
  };

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

  getOfflineImportMetadata: CodexResource<Twl>['getOfflineImportMetadata'] =
    async (params) => {
      const { fs, resourceUri } = params;

      const metadataUri = Uri.joinPath(resourceUri, 'metadata.json');

      const metadataFile = await fs.readFile(metadataUri);
      const metadataJson = JSON.parse(metadataFile.toString());
      const metadata = metadataJson as Twl;
      const primaryKey = Object.keys(metadata.identification.primary);
      const primaryId = Object.keys(
        metadata.identification.primary[primaryKey[0]],
      );
      const revision = metadata.identification.primary[primaryKey[0]][primaryId[0]].revision;
      return {
        ...metadata,
        name: metadata?.identification?.name.en,
        id: String(primaryId[0]),
        version: revision,
      };
    };
  getOfflineConfigResourceValues: CodexResource<Twl>['getOfflineConfigResourceValues'] =
    async (params) => {
      const { fs, resourceUri } = params;

      const metadataUri = Uri.joinPath(resourceUri, 'metadata.json');

      const metadataFile = await fs.readFile(metadataUri);
      const metadataJson = JSON.parse(metadataFile.toString());
      const metadata = metadataJson as Twl;

      const localPath: string = resourceUri.fsPath;
      const primaryKey = Object.keys(metadata.identification.primary);
      const primaryId = Object.keys(
        metadata.identification.primary[primaryKey[0]],
      );
      const revision = metadata.identification.primary[primaryKey[0]][primaryId[0]].revision;
      const downloadedResource: ConfigResourceValues = {
        name: metadata?.identification?.name.en,
        id: String(primaryId[0]),
        localPath: localPath,
        type: this.id,
        remoteUrl: '',
        version: revision,
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
