import * as folio from 'folio';
import playwright from 'playwright';
import { BaseEnv, PlaywrightOptions } from './baseEnv';
import { ServerEnv, Credentials } from '../targets';
import { EmailClient } from '../targets/email';
import * as poms from '../pages';
import { EnvName, create as createEnv } from '../targets';

type MultiOptions = {
  envName?: EnvName;
  browsers?: number;
} & PlaywrightOptions;

export class MultiEnv extends BaseEnv {
  private env: ServerEnv;
  private credentials: Credentials;
  private extraContexts: playwright.BrowserContext[];

  hasBeforeAllOptions(options: MultiOptions) {
    return 'envName' in options || 'browsers' in options;
  }

  async beforeAll(options: MultiOptions, workerInfo: folio.WorkerInfo) {
    await super.beforeAll(options, workerInfo);
    this.env = createEnv(options.envName);
  }

  async beforeEach(options: MultiOptions, testInfo: folio.TestInfo) {
    await super.beforeEach({}, testInfo);
    const extra = ((options.browsers || 2) as number) - 1;
    const email = EmailClient.emailFromTestTitle(testInfo.title);
    const password = 'asdzxcasd';
    await this.env.email.clear(email);
    this.extraContexts = [];
    try {
      this.credentials = await this.env.createAccount(email, password);
    } catch (e) {
      console.error(e);
      await this.env.auth.accountDestroy(email, password);
      this.credentials = await this.env.createAccount(email, password);
    }

    const browsers = [poms.create(this.page, this.env)];
    for (let i = 0; i < extra; i++) {
      const c = await this.browser.newContext();
      browsers.push(poms.create(await c.newPage(), this.env));
      this.extraContexts.push(c);
    }
    return {
      env: this.env,
      credentials: this.credentials,
      browsers,
    };
  }

  async afterEach({}, testInfo: folio.TestInfo) {
    await super.afterEach({}, testInfo);
    if (this.page) {
      await this.page.close();
    }
    this.page = undefined;
    if (this.context) {
      await this.context.close();
    }
    this.context = undefined;
    await this.env.email.clear(this.credentials.email);
    try {
      await this.env.auth.accountDestroy(
        this.credentials.email,
        this.credentials.password
      );
    } catch (e) {
      // a test may delete the account
      if (e.errno !== 102) {
        throw e;
      }
    }
    await Promise.all(this.extraContexts.map((c) => c.close()));
    this.extraContexts = [];
  }
}

export const test = folio.test.extend(new MultiEnv());
export { expect } from 'folio';
