import { BasePage } from './base';

export class LoginPage extends BasePage {
  readonly path = '';

  async login(email: string, password: string, recoveryCode?: string) {
    await this.setEmail(email);
    await this.page.click('button[type=submit]');
    await this.setPassword(password);
    await this.submit();
    if (recoveryCode) {
      await this.clickUseRecoveryCode();
      await this.setRecoveryCode(recoveryCode);
      await this.submit();
    }
  }

  setEmail(email: string) {
    return this.page.fill('input[type=email]', email);
  }

  setPassword(password: string) {
    return this.page.fill('input[type=password]', password);
  }

  async clickUseRecoveryCode() {
    return this.page.click('#use-recovery-code-link');
  }

  async setRecoveryCode(code: string) {
    return this.page.fill('input[type=text]', code);
  }

  async submit() {
    return Promise.all([
      this.page.click('button[type=submit]'),
      this.page.waitForNavigation({ waitUntil: 'networkidle' }),
    ]);
  }

  useCredentials(credentials: any) {
    return this.page.evaluate((creds) => {
      localStorage.setItem(
        '__fxa_storage.accounts',
        JSON.stringify({
          [creds.uid]: {
            sessionToken: creds.sessionToken,
            uid: creds.uid,
          },
        })
      );
      localStorage.setItem(
        '__fxa_storage.currentAccountUid',
        JSON.stringify(creds.uid)
      );
    }, credentials);
  }
}
