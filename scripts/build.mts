import type { BuildOptions } from "https://deno.land/x/esbuild@v0.21.4/mod.js";
import { build, stop } from "https://deno.land/x/esbuild@v0.21.4/mod.js";
import { resolve } from "https://deno.land/std@0.224.0/path/mod.ts";

const prod = Deno.args.includes("--prod");

const nodeTarget = "node16.13";

const rootPath = Deno.cwd();
const distPath = resolve(rootPath, "dist");
const pkgsPath = resolve(rootPath, "packages");

const globalSharedConfig: BuildOptions = {
  sourcemap: false,
  legalComments: "none",
  // sourceRoot: rootPath,
  format: "esm",
  target: nodeTarget,
  minify: prod,
  color: true,
  logLevel: "warning",

  bundle: true,
  platform: "node",
  loader: { ".ts": "ts", ".js": "js" },
  resolveExtensions: [".ts", ".js"],
};

await Promise.all([
  // client
  build({
    ...globalSharedConfig,
    format: "cjs",
    sourcemap: !prod,

    outfile: resolve(distPath, "extension.js"),
    banner: { js: "'use strict';" },
    external: ["vscode"],
    tsconfig: resolve(pkgsPath, "client", "tsconfig.json"),
    entryPoints: [resolve(pkgsPath, "client", "src", "extension.ts")],
  }),

  // server
  build({
    ...globalSharedConfig,

    outfile: resolve(distPath, "server.mjs"),
    banner: { js: `import{createRequire}from"module";const require=createRequire(import.meta.url);` },
    tsconfig: resolve(pkgsPath, "server", "tsconfig.json"),
    entryPoints: [resolve(pkgsPath, "server", "src", "index.ts")],
  }),
]);

stop();
