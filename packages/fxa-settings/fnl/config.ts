import { test as multiTest, MultiBrowserEnv } from './lib/presets/multiBrowser';
import path from 'path';
import { setConfig, PlaywrightOptions } from './lib/presets/fast';
import { SingleAccountEnv, test } from './lib/presets/singleAccount';

const timeout = process.env.PWDEBUG ? 0 : 10000;

setConfig({
  testDir: __dirname,
  outputDir: path.resolve(__dirname, '../../../artifacts/functional'),
  timeout,
  retries: 1,
});

const options: PlaywrightOptions = {
  // devtools: true,
  headless: !process.env.DEBUG,
  // slowMo: 1000,
  viewport: { width: 1280, height: 720 },
};

export { test };
export { multiTest };
export { expect } from '@playwright/test';

test.runWith(new SingleAccountEnv('local', options), { tag: 'firefox' });
multiTest.runWith(new MultiBrowserEnv('local', options));
