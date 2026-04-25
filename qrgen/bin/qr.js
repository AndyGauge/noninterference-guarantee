#!/usr/bin/env node
// `npm run qr -- "https://example.com" > static/qr.svg`
//
// Thin Node wrapper that builds the bundled qrgen Rust binary on first
// use, then forwards all flags to it. Output goes to stdout if no second
// positional arg is given, otherwise to that file path.

import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CRATE_DIR = path.resolve(__dirname, '..', 'crate');
const BIN_PATH = path.resolve(CRATE_DIR, 'target', 'release', 'qrgen');
const MANIFEST = path.resolve(CRATE_DIR, 'Cargo.toml');

function ensureBuilt() {
  if (fs.existsSync(BIN_PATH)) return;

  const haveCargo = spawnSync('cargo', ['--version'], { stdio: 'ignore' });
  if (haveCargo.status !== 0) {
    console.error('');
    console.error('qrgen needs `cargo` (Rust) to build the binary the first time.');
    console.error('Install it: https://rustup.rs');
    console.error('');
    console.error('If you do not want a Rust dependency, the runtime QrCode.svelte');
    console.error('component still works fine — it uses the `qrcode` npm package.');
    console.error('Skip `npm run qr` and edit static/qr.svg by hand instead.');
    console.error('');
    process.exit(1);
  }

  console.error('qrgen: building Rust binary (one-time, takes ~30s)…');
  const build = spawnSync(
    'cargo',
    ['build', '--release', '--manifest-path', MANIFEST],
    { stdio: 'inherit' }
  );
  if (build.status !== 0) {
    console.error('qrgen: cargo build failed');
    process.exit(build.status || 1);
  }
}

function main() {
  ensureBuilt();

  const args = process.argv.slice(2);
  const result = spawnSync(BIN_PATH, args, {
    stdio: ['inherit', 'inherit', 'inherit']
  });
  process.exit(result.status ?? 0);
}

main();
