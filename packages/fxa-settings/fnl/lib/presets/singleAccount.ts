import { EnvName, create as creatEnv } from '../env';
import { BaseEnv, Credentials } from '../env/base';
import { EmailClient } from '../env/email';
import * as poms from '../pages';
import {
  FastEnv,
  newTestType,
  PlaywrightOptions,
  TestInfo,
  WorkerInfo,
} from './fast';

export class SingleAccountEnv extends FastEnv {
  private readonly env: BaseEnv;
  private credentials: Credentials;

  constructor(envName: EnvName, options?: PlaywrightOptions) {
    super(options);
    this.env = creatEnv(envName);
  }
  async beforeAll(workerInfo: WorkerInfo) {
    await super.beforeAll(workerInfo);
    const email = EmailClient.emailFromTestTitle(
      `test_worker_${workerInfo.workerIndex}`
    );
    const password = 'asdzxcasd';
    await this.env.email.clear(email);
    try {
      this.credentials = await this.env.createAccount(email, password);
    } catch (e) {
      console.error(e);
      await this.env.auth.accountDestroy(email, password);
      this.credentials = await this.env.createAccount(email, password);
    }
    this.storageState = {
      cookies: [],
      origins: [
        {
          origin: this.env.contentServerUrl,
          localStorage: [
            {
              name: '__fxa_storage.currentAccountUid',
              value: JSON.stringify(this.credentials.uid),
            },
            {
              name: '__fxa_storage.accounts',
              value: JSON.stringify({
                [this.credentials.uid]: {
                  sessionToken: this.credentials.sessionToken,
                  uid: this.credentials.uid,
                },
              }),
            },
          ],
        },
      ],
    };
    this.context = await this.browser.newContext({
      storageState: this.storageState,
      ...this.options,
    });
  }

  async beforeEach(testInfo: TestInfo) {
    const result = await super.beforeEach(testInfo);
    const pages = poms.create(result.page, this.env);
    return {
      env: this.env,
      credentials: this.credentials,
      pages,
      ...result,
    };
  }

  async afterEach(testInfo: TestInfo) {
    await super.afterEach(testInfo);
  }

  async afterAll(workerInfo: WorkerInfo) {
    await super.afterAll(workerInfo);
    await this.env.email.clear(this.credentials.email);
    await this.env.auth.accountDestroy(
      this.credentials.email,
      this.credentials.password
    );
  }
}

export const test = newTestType<{
  env: BaseEnv;
  credentials: Credentials;
  pages: ReturnType<typeof poms['create']>;
}>();
