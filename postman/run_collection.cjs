const path = require('node:path');
const { spawnSync } = require('node:child_process');
const npmCli = process.env.npm_execpath || path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js');
const args = [npmCli, 'exec', '--yes', '--package=newman', '--', 'newman', 'run', path.join(__dirname, 'BrewLite-VNPay.postman_collection.json'), '--env-var', 'baseUrl=' + (process.env.API_URL || 'http://localhost:4000')];
const folder = process.argv[2];
if (folder) args.push('--folder', folder);
const result = spawnSync(process.execPath, args, { stdio: 'inherit', shell: false });
if (result.error) console.error(result.error.message);
process.exitCode = result.status ?? 1;
