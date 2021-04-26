import { EnvName, create as createEnv } from '../env';
import { BaseEnv, Credentials } from '../env/base';
import { EmailClient } from '../env/email';
import * as poms from '../pages';
import {
  FastEnv,
  TestInfo,
  PlaywrightOptions,
  WorkerInfo,
  newTestType,
} from './fast';
import { BrowserContext } from 'playwright';

export class MultiBrowserEnv extends FastEnv {
  private readonly env: BaseEnv;
  private extraContexts: BrowserContext[];
  private credentials: Credentials;

  constructor(envName: EnvName, options?: PlaywrightOptions) {
    super(options);
    this.env = createEnv(envName);
    this.extraContexts = [];
  }
  async beforeAll(workerInfo: WorkerInfo) {
    await super.beforeAll(workerInfo);
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
      const c = await this.browser.newContext();
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

  async afterAll(workerInfo: WorkerInfo) {
    await super.afterAll(workerInfo);
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
