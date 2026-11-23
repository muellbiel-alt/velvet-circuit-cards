// Velvet Circuit — Make.fun submission entrypoint (Node 22, standard library only).
// Copies game/ and screenshots/ into MAKEFUN_OUTPUT_DIR (or /output) and emits
// a deterministic dossier.json built by the unchanged vendor/makefun-game.ts library.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'game'), join(outputDir, 'game'), { recursive: true });

const screenshotsOut = join(outputDir, 'screenshots');
mkdirSync(screenshotsOut, { recursive: true });
const screenshotsSrc = join(repoRoot, 'screenshots');
if (existsSync(screenshotsSrc)) {
  cpSync(screenshotsSrc, screenshotsOut, { recursive: true });
}

const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(outputDir, 'dossier.json'), dossier);
