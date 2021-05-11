import { test as multiTest, MultiBrowserEnv } from './lib/presets/multiBrowser';
import path from 'path';
import {
  expect,
  setConfig,
  PlaywrightOptions,
  setReporters,
  reporters,
} from './lib/presets/fast';
import { SingleAccountEnv, test } from './lib/presets/singleAccount';

const timeout = process.env.PWDEBUG ? 0 : 30000;

setConfig({
  testDir: __dirname,
  outputDir: path.resolve(__dirname, '../../../artifacts/functional'),
  timeout,
  retries: 1,
});

if (process.env.CI) {
  setReporters([
    new reporters.junit({
      outputFile: path.resolve(
        __dirname,
        '../../../artifacts/tests/test-results.xml'
      ),
    }),
    new reporters.list(),
  ]);
}

const options: PlaywrightOptions = {
  // devtools: true,
  headless: !process.env.DEBUG,
  // slowMo: 1000,
  viewport: { width: 1280, height: 720 },
};

export { test };
export { multiTest };
export { expect };

test.runWith(new SingleAccountEnv('local', options), { tag: 'firefox' });
multiTest.runWith(new MultiBrowserEnv('local', options));
