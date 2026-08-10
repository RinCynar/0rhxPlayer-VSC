import type { NeteaseTypings } from "api";
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
    #lyric { display: flex; flex-direction: column; padding: 45% 12px 45% 12px; }
    .line { padding: 6px 0; opacity: 0.45; line-height: 1.45; transition: opacity 0.25s ease; }
    .line.active { opacity: 1; }
    .ori { font-size: 14px; color: var(--vscode-foreground); }
    .line.active .ori { color: var(--vscode-textLink-foreground); font-weight: 600; }
    .tra { display: block; font-size: 12px; opacity: 0.55; color: var(--vscode-foreground); }
    .empty { padding: 24px; text-align: center; color: var(--vscode-descriptionForeground); }
  </style>
</head>
<body>
  <div id="lyric"></div>
  <script nonce="${getNonce()}">
    (function () {
      const vscode = acquireVsCodeApi();
      const container = document.getElementById("lyric");
      let texts = [];
      let current = 0;
      let firstRender = true;

      function render() {
        container.innerHTML = "";
        // Skip placeholder lines ("~") so no ghost lyric row is shown.
        const visible = [];
        const indexMap = [];
        for (let i = 0; i < texts.length; i++) {
          const line = texts[i];
          if (line && line[0] && line[0] !== "~") {
            indexMap.push(i);
            visible.push(line);
          }
        }
        if (!visible.length) {
          const empty = document.createElement("div");
          empty.className = "empty";
          empty.textContent = "No synchronized lyric";
          container.appendChild(empty);
          return;
        }
        const cur = indexMap.indexOf(current);
        const frag = document.createDocumentFragment();
        for (let i = 0; i < visible.length; i++) {
          const div = document.createElement("div");
          div.className = "line" + (i === cur ? " active" : "");
          const ori = document.createElement("span");
          ori.className = "ori";
          ori.textContent = visible[i][0] || "";
          div.appendChild(ori);
          const tra = visible[i][1];
          if (tra) {
            const t = document.createElement("span");
            t.className = "tra";
            t.textContent = tra;
            div.appendChild(t);
          }
          frag.appendChild(div);
        }
        container.appendChild(frag);
        const active = container.children[cur];
        if (active) {
          if (firstRender) {
            active.scrollIntoView({ block: "center" });
            firstRender = false;
          } else {
            active.scrollIntoView({ block: "center", behavior: "smooth" });
          }
        }
      }

      window.addEventListener("message", (e) => {
        const data = e.data;
        if (!data) return;
        if (data.command === "lyric") {
          texts = data.lyric && data.lyric.text ? data.lyric.text : [];
          current = 0;
          firstRender = true;
          render();
        } else if (data.command === "index") {
          if (typeof data.idx === "number" && data.idx !== current) {
            current = data.idx;
            render();
          }
        }
      });
      vscode.postMessage({ command: "init" });
    })();
  </script>
</body>
</html>`;

export class LyricViewProvider implements WebviewViewProvider {
  private static _view?: WebviewView;

  private static _last?: NeteaseTypings.LyricData;

  private static _lastIdx = 0;

  resolveWebviewView(view: WebviewView): void {
    view.webview.options = { enableScripts: true };
    view.webview.html = html;
    LyricViewProvider._view = view;
    // The view may be created after the playback state was restored: replay it.
    if (LyricViewProvider._last) {
      view.webview.postMessage({ command: "lyric", lyric: LyricViewProvider._last });
      view.webview.postMessage({ command: "index", idx: LyricViewProvider._lastIdx });
    }
  }

  static lyric(lyric: NeteaseTypings.LyricData): void {
    LyricViewProvider._last = lyric;
    LyricViewProvider._view?.webview.postMessage({ command: "lyric", lyric });
  }

  static index(idx: number): void {
    LyricViewProvider._lastIdx = idx;
    LyricViewProvider._view?.webview.postMessage({ command: "index", idx });
  }
}
