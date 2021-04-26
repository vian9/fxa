import { Page } from 'playwright';
import { BaseEnv } from '../env/base';

export abstract class BasePage {
  readonly path?: string;

  constructor(protected readonly page: Page, protected readonly env: BaseEnv) {}

  protected get baseUrl() {
    return this.env.baseUrl;
  }

  goto() {
    return this.page.goto(`${this.baseUrl}/${this.path}`);
  }

  alertBarText() {
    return this.page.innerText('[data-testid=alert-bar-content]');
  }

  async waitForAlertBar() {
    return this.page.waitForSelector('[data-testid=alert-bar-content]');
  }

  clickModalConfirm() {
    return Promise.all([
      this.page.click('[data-testid=modal-confirm]'),
      this.waitForAlertBar(),
    ]);
  }

  async logout() {
    await this.page.click('[data-testid=drop-down-avatar-menu-toggle]');
    await Promise.all([
      this.page.click('[data-testid=avatar-menu-sign-out]'),
      this.page.waitForNavigation(),
    ]);
  }

  screenshot() {
    return this.page.screenshot({ fullPage: true });
  }
}
