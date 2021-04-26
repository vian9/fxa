import { BasePage } from './base';

export class RecoveryKeyPage extends BasePage {
  readonly path = 'settings/account_recovery';

  setPassword(password: string) {
    return this.page.fill('input[type=password]', password);
  }

  submit() {
    return this.page.click('button[type=submit]');
  }

  clickClose() {
    return Promise.all([
      this.page.click('[data-testid=close-button]'),
      this.page.waitForNavigation(),
    ]);
  }
}
