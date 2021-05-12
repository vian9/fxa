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
    if (!this.context) {
      this.context = await this.browser.newContext(this.options);
    }
    if (!this.page) {
      this.page = await this.context.newPage();
    }
    return {};
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
