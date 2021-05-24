import * as folio from 'folio';
import { BaseEnv, PlaywrightOptions } from './baseEnv';
import { ServerEnv, Credentials } from '../targets';
import { EmailClient } from '../targets/email';
import * as poms from '../pages';
import { EnvName, create as createEnv } from '../targets';

type SerialOptions = {
  envName: EnvName;
} & PlaywrightOptions;

export class SerialEnv extends BaseEnv {
  private env: ServerEnv;
  private credentials: Credentials;

  hasBeforeAllOptions(options: SerialOptions) {
    return 'envName' in options;
  }

  async beforeAll(options: SerialOptions, workerInfo: folio.WorkerInfo) {
    await super.beforeAll(options, workerInfo);
    this.env = createEnv(options.envName);
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
    return {
      context: this.context,
      env: this.env,
    };
  }

  async beforeEach({}, testInfo: folio.TestInfo) {
    await super.beforeEach({}, testInfo);
    const pages = poms.create(this.page, this.env);
    return {
      env: this.env,
      credentials: this.credentials,
      pages,
    };
  }

  async afterEach({}, testInfo: folio.TestInfo) {
    await super.afterEach({}, testInfo);
    await this.page.goto('about:blank');
  }

  async afterAll({}, workerInfo: folio.WorkerInfo) {
    await super.afterAll({}, workerInfo);
    await this.env.email.clear(this.credentials.email);
    await this.env.auth.accountDestroy(
      this.credentials.email,
      this.credentials.password
    );
  }
}

export const test = folio.test.extend(new SerialEnv());
export { expect } from 'folio';
