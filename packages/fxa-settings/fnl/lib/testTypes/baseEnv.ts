import fs from 'fs/promises';
import * as folio from 'folio';
import playwright from 'playwright';

export type PlaywrightOptions = playwright.LaunchOptions &
  playwright.BrowserContextOptions;

export abstract class BaseEnv {
  protected options: PlaywrightOptions;
  protected browser: playwright.Browser;
  protected context: playwright.BrowserContext;
  protected storageState?: playwright.BrowserContextOptions['storageState'];
  protected page: playwright.Page;
  private consoleLogs: string[] = [];

  hasBeforeAllOptions(options: PlaywrightOptions) {
    return true;
  }

  async beforeAll(options: PlaywrightOptions, workerInfo: folio.WorkerInfo) {
    this.options = options || {};
    this.browser = await playwright.firefox.launch({
      ...options,
      handleSIGINT: false,
    });
  }

  async beforeEach({}, testInfo: folio.TestInfo) {
    if (!this.context || testInfo.retry) {
      const options = { ...this.options };
      if (this.page) {
        this.page.close();
        this.page = undefined;
      }
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
    if (!this.page) {
      this.page = await this.context.newPage();
    }
    if (testInfo.retry) {
      this.page.on('console', async (msg) => {
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
    return {};
  }

  async afterEach({}, testInfo: folio.TestInfo) {
    if (
      testInfo.status !== testInfo.expectedStatus &&
      this.consoleLogs.length > 0
    ) {
      const filename = testInfo.outputPath('console.log');
      await fs.writeFile(filename, this.consoleLogs.join('\r\n'));
    }
    this.consoleLogs = [];
  }

  async afterAll({}, workerInfo: folio.WorkerInfo) {
    if (this.page) await this.page.close();
    this.page = undefined;
    if (this.context) await this.context.close();
    this.context = undefined;
    if (this.browser) await this.browser.close();
    this.browser = undefined;
  }
}
