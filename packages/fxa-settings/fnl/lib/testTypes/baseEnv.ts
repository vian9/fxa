import fs from 'fs/promises';
import * as folio from 'folio';
import playwright from 'playwright';

class PWLogger implements playwright.Logger {
  private lines: string[] = [];

  isEnabled(
    name: string,
    severity: 'verbose' | 'info' | 'warning' | 'error'
  ): boolean {
    return true;
  }

  log(
    name: string,
    severity: 'verbose' | 'info' | 'warning' | 'error',
    message: string | Error,
    args: Object[],
    hints: { color?: string }
  ): void {
    this.lines.push(message.toString());
  }

  reset() {
    const log = this.lines.join('\r\n');
    this.lines = [];
    return log;
  }
}

export type PlaywrightOptions = playwright.LaunchOptions &
  playwright.BrowserContextOptions;

export abstract class BaseEnv {
  protected options: PlaywrightOptions;
  protected browser: playwright.Browser;
  protected context: playwright.BrowserContext;
  protected storageState?: playwright.BrowserContextOptions['storageState'];
  protected page: playwright.Page;
  private consoleLogs: string[] = [];
  private logger: PWLogger;

  hasBeforeAllOptions(options: PlaywrightOptions) {
    return true;
  }

  async beforeAll(options: PlaywrightOptions, workerInfo: folio.WorkerInfo) {
    this.options = options || {};
    this.logger = new PWLogger();
    this.browser = await playwright.firefox.launch({
      ...options,
      handleSIGINT: false,
      logger: this.logger,
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
    const logs = this.logger.reset();
    if (testInfo.status !== testInfo.expectedStatus) {
      if (this.consoleLogs.length > 0) {
        await fs.writeFile(
          testInfo.outputPath('console.log'),
          this.consoleLogs.join('\r\n')
        );
      }
      await fs.writeFile(testInfo.outputPath('pw.log'), logs);
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
