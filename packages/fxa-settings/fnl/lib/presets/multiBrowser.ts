import { BrowserContext } from 'playwright';
import {
  newTestType,
  PlaywrightEnv,
  PlaywrightOptions,
  TestInfo,
} from '@playwright/test';
import * as poms from '../pages';
import { EnvName, create as createEnv } from '../env';
import { BaseEnv, Credentials } from '../env/base';
import { EmailClient } from '../env/email';

export class MultiBrowserEnv extends PlaywrightEnv {
  private readonly env: BaseEnv;
  private extraContexts: Array<BrowserContext>;
  private credentials: Credentials;

  constructor(envName: EnvName, options?: PlaywrightOptions) {
    super('firefox', options);
    this.env = createEnv(envName);
    this.extraContexts = [];
  }
  async beforeAll() {
    await super.beforeAll();
  }

  async beforeEach(testInfo: TestInfo) {
    const result = await super.beforeEach(testInfo);
    const extra = ((testInfo.testOptions.browsers || 2) as number) - 1;
    const email = EmailClient.emailFromTestTitle(testInfo.title);
    const password = 'asdzxcasd';
    await this.env.email.clear(email);
    this.credentials = await this.env.createAccount(email, password);

    const browsers = [poms.create(result.page, this.env)];
    for (let i = 0; i < extra; i++) {
      const c = await result.browser.newContext();
      browsers.push(poms.create(await c.newPage(), this.env));
      this.extraContexts.push(c);
    }
    return {
      env: this.env,
      credentials: this.credentials,
      browsers,
      ...result,
    };
  }

  async afterEach(testInfo: TestInfo) {
    await super.afterEach(testInfo);
    await this.env.email.clear(this.credentials.email);
    await this.env.auth.accountDestroy(
      this.credentials.email,
      this.credentials.password
    );
    await Promise.all(this.extraContexts.map((c) => c.close()));
  }

  async afterAll() {
    await super.afterAll();
  }
}

export const test = newTestType<
  {
    env: BaseEnv;
    credentials: Credentials;
    browsers: Array<ReturnType<typeof poms['create']>>;
  },
  { browsers: number }
>();
