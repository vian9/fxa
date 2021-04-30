import { BasePage } from './base';

export class SecondaryEmailPage extends BasePage {
  readonly path = 'settings/emails';

  setEmail(name: string) {
    return this.page.fill('input[type=email]', name);
  }

  setVerificationCode(code: string) {
    return this.page.fill('input[type=text]', code);
  }

  submit() {
    return Promise.all([
      this.page.click('button[type=submit]'),
      this.page.waitForNavigation(),
    ]);
  }
}
