import { BasePage } from './base';

export class LoginPage extends BasePage {
  goto() {
    return this.page.goto(`${this.baseUrl}`);
  }

  async login(email: string, password: string) {
    await this.page.fill('input[type=email]', email);
    await this.page.click('button[type=submit]');
    await this.page.fill('input[type=password]', password);
    await Promise.all([
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
