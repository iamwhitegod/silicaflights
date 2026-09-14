import { spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { delimiter, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseEnv } from 'node:util';

// Load only TestSprite's credential, without forwarding the flight-provider .env values.
const projectPath = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(projectPath, '.env.local');
const localEnv = existsSync(envPath) ? parseEnv(readFileSync(envPath, 'utf8')) : {};
const apiKey = process.env.TESTSPRITE_API_KEY || localEnv.TESTSPRITE_API_KEY;
const serverPath = process.argv[2];

if (Number(process.versions.node.split('.')[0]) < 22) {
  console.error('TestSprite MCP requires Node.js 22 or newer.');
  process.exit(1);
}
if (!serverPath || !existsSync(serverPath)) {
  console.error('Pass the installed TestSprite MCP dist/index.js path to this launcher.');
  process.exit(1);
}
if (!apiKey) {
  console.error('Set TESTSPRITE_API_KEY in .env.local or the environment to run TestSprite.');
  process.exit(1);
}

const server = spawn(process.execPath, [serverPath], {
  cwd: projectPath,
  env: {
    ...process.env,
    PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH || ''}`,
    API_KEY: apiKey,
  },
  stdio: 'inherit',
});
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.kill(signal));
}
server.once('error', () => {
  console.error('Could not start the installed TestSprite MCP server.');
  process.exit(1);
});
server.once('exit', (code) => process.exit(code ?? 1));
