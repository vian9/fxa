import { BasePage } from './base';

export class RelierPage extends BasePage {
  goto() {
    return this.page.goto(`${this.env.relierUrl}`);
  }

  clickEmailFirst() {
    return Promise.all([
      this.page.click('button.email-first-button'),
      this.page.waitForNavigation(),
    ]);
  }
}
