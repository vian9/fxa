import { BasePage } from './base';
import { getCode } from '../../../src/lib/totp';

export class TotpPage extends BasePage {
  goto() {
    return this.page.goto(`${this.baseUrl}/settings/two_step_authentication`);
  }

  async setSecurityCode() {
    await this.page.click('[data-testid=cant-scan-code]');
    const secret = (
      await this.page.innerText('[data-testid=manual-code]')
    ).replace(/\s/g, '');
    const code = await getCode(secret);
    return this.page.fill('input[type=text]', code);
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

  getRecoveryCode() {
    return this.page.innerText('[data-testid=datablock] span:nth-child(1)');
  }

  setRecoveryCode(code: string) {
    return this.page.fill('[data-testid=recovery-code-input-field]', code);
  }
}
