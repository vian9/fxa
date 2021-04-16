import { setConfig, PlaywrightOptions } from '@playwright/test';
import { test, LoggedInEnv } from './lib/presets/loggedIn';
import { test as multiTest, MultiBrowserEnv } from './lib/presets/multiBrowser';

const timeout = process.env.PWDEBUG ? 0 : 30000;

setConfig({
  testDir: __dirname,
  timeout,
  retries: 1,
});

const options: PlaywrightOptions = {
  // devtools: true,
  // headless: false,
  // slowMo: 1000,
  viewport: { width: 1280, height: 720 },
  video: 'retry-with-video',
};

export { test };
export { multiTest };
export { expect } from '@playwright/test';

test.runWith(new LoggedInEnv('local', options), { tag: 'firefox' });
multiTest.runWith(new MultiBrowserEnv('local', options));
