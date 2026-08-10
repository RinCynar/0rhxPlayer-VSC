import type { WebviewView, WebviewViewProvider } from "vscode";

const getNonce = (): string => {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
};

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <style>
    html, body { margin: 0; padding: 0; height: 100%; background: transparent; }
    .wrap {
      box-sizing: border-box;
      width: 100%;
      aspect-ratio: 1 / 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px;
    }
    img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <img id="art" alt="" style="display:none" />
  </div>
  <script nonce="${getNonce()}">
    (function () {
      const vscode = acquireVsCodeApi();
      const img = document.getElementById("art");
      window.addEventListener("message", (e) => {
        const data = e.data;
        if (!data || data.command !== "artwork") return;
        if (data.dataUrl) {
          img.src = data.dataUrl;
          img.style.display = "block";
        } else {
          img.style.display = "none";
        }
      });
      vscode.postMessage({ command: "init" });
    })();
  </script>
</body>
</html>`;

export class ArtworkViewProvider implements WebviewViewProvider {
  private static _view?: WebviewView;

  resolveWebviewView(view: WebviewView): void {
    view.webview.options = { enableScripts: true };
    view.webview.html = html;
    ArtworkViewProvider._view = view;
  }

  static artwork(dataUrl?: string): void {
    ArtworkViewProvider._view?.webview.postMessage({ command: "artwork", dataUrl });
  }
}
