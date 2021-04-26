import fs from 'fs/promises';
import {
  Browser,
  BrowserContext,
  BrowserContextOptions,
  Page,
  LaunchOptions,
} from 'playwright';
import * as folio from 'folio';
import playwright from 'playwright';
export * from 'folio';
export { BrowserContextOptions, LaunchOptions } from 'playwright';

// Arguments available to the test function.
export type PlaywrightTestArgs = {
  page: Page;
};

export type PlaywrightOptions =
  // All browser launch options are supported.
  LaunchOptions &
    // All browser context options are supported.
    BrowserContextOptions; // Testing options.

export class FastEnv implements folio.Env<PlaywrightTestArgs> {
  protected options: PlaywrightOptions;
  protected browser: Browser | undefined;
  protected context: BrowserContext | undefined;
  protected storageState?: BrowserContextOptions['storageState'];
  private pages: Map<string, Page> = new Map();
  private consoleLogs: string[] = [];

  constructor(options: PlaywrightOptions = {}) {
    this.options = options;
  }

  async beforeAll(workerInfo: folio.WorkerInfo) {
    this.browser = await playwright.firefox.launch({
      ...this.options,
      handleSIGINT: false,
    });
  }

  async beforeEach(testInfo: folio.TestInfo) {
    if (!this.context || testInfo.retry) {
      const options = this.options;
      if (testInfo.retry) {
        options.recordHar = {
          path: testInfo.outputPath('test.har'),
        };
        options.recordVideo = {
          dir: testInfo.outputPath('video'),
          size: {
            width: 1280,
            height: 720,
          },
        };
        options.storageState = this.storageState;
      }
      this.context = await this.browser.newContext(options);
    }
    const page = await this.context.newPage();
    if (testInfo.retry) {
      page.on('console', async (msg) => {
        let str = msg.text();
        if (str.includes('JSHandle')) {
          try {
            str = (await Promise.all(msg.args().map((a) => a.jsonValue())))
              .map((o) => (typeof o === 'string' ? o : JSON.stringify(o)))
              .join(' ');
          } catch (e) {}
        }
        this.consoleLogs.push(`${msg.type()}: ${str}`);
      });
    }
    this.pages.set(testInfo.title, page);
    return {
      page,
    };
  }

  async afterEach(testInfo: folio.TestInfo) {
    if (
      testInfo.status !== testInfo.expectedStatus &&
      this.consoleLogs.length > 0
    ) {
      const file = testInfo.outputPath('console.log');
      await fs.writeFile(file, this.consoleLogs.join('\r\n'));
    }
    this.consoleLogs = [];
    const page = this.pages.get(testInfo.title);
    await page.close();
  }

  async afterAll(workerInfo: folio.WorkerInfo) {
    this.pages.clear();
    if (this.context) await this.context.close();
    this.context = undefined;
    if (this.browser) await this.browser.close();
    this.browser = undefined;
  }
}

type PlaywrightTestOptions = {
  // Browser context options for a single test,
  // in addition to context options specified for the whole environment.
  contextOptions?: BrowserContextOptions;
};

export function newTestType<TestArgs = {}, TestOptions = {}>() {
  return folio.newTestType<
    TestArgs & PlaywrightTestArgs,
    TestOptions & PlaywrightTestOptions
  >();
}

export const test = newTestType();
