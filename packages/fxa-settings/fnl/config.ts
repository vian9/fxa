import * as folio from 'folio';
import path from 'path';
import { EnvName } from './lib/targets';

const target =
  (folio.registerCLIOption(
    'target',
    'Target server environment: local | stage | production'
  ).value as EnvName) || 'local';
let debug =
  folio.registerCLIOption('debug', 'Run with the Playwright Inspector', {
    type: 'boolean',
  }).value || !!process.env.PWDEBUG;

if (debug) {
  process.env.PWDEBUG = '1';
}
// The DEBUG env is used to debug without the playwright inspector, like in vscode
debug = debug || !!process.env.DEBUG;

const config: folio.Config = {
  outputDir: path.resolve(__dirname, '../../../artifacts/functional'),
  timeout: debug ? 0 : 30000,
  retries: debug ? 0 : 1,
  reporter: process.env.CI
    ? [
        'dot',
        {
          name: 'junit',
          outputFile: path.resolve(
            __dirname,
            '../../../artifacts/tests/test-results.xml'
          ),
        },
      ]
    : 'list',
  projects: [
    {
      name: target,
      testDir: __dirname,
      options: {
        args: debug ? ['-start-debugger-server'] : undefined,
        firefoxUserPrefs: debug
          ? {
              'devtools.debugger.remote-enabled': true,
              'devtools.chrome.enabled': true,
              'devtools.debugger.prompt-connection': false,
            }
          : undefined,
        envName: target,
        headless: !debug,
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
  workers: debug ? 1 : undefined,
};

export default config;
