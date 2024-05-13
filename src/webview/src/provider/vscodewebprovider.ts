import type { WebviewApi } from 'vscode-webview';

class VsCodeWebInstanceProvider {
  private readonly vsCodeApi: WebviewApi<unknown> | undefined;

  constructor() {
    // ensure vscodeapi is not inited in the current web view
    if (typeof acquireVsCodeApi === 'function') {
      this.vsCodeApi = acquireVsCodeApi();
    }
  }

  /**
   * post event to provider
   * non primitive values should be serialised
   */
  public postMessage(message: unknown) {
    // TODO : Need to add types here later
    if (this.vsCodeApi) {
      this.vsCodeApi.postMessage(message);
    }
  }
}

export const vscode = new VsCodeWebInstanceProvider();
