import { BasePage } from './base';

export class RelierPage extends BasePage {
  goto(query?: string) {
    const url = query ? `${this.env.relierUrl}?${query}` : this.env.relierUrl;
    return this.page.goto(url);
  }

  isLoggedIn() {
    return this.page.isVisible('#loggedin', { timeout: 1000 });
  }

  isPro() {
    return this.page.isVisible('.pro-status', { timeout: 1000 });
  }

  async logout() {
    await Promise.all([
      this.page.click('#logout'),
      this.page.waitForResponse(/\/api\/logout/),
    ]);
  }

  clickEmailFirst() {
    return Promise.all([
      this.page.click('button.email-first-button'),
      this.page.waitForNavigation(),
    ]);
  }

  async clickSubscribe() {
    await Promise.all([
      this.page.click('a[data-currency=usd]'),
      this.page.waitForNavigation({ waitUntil: 'networkidle' }),
    ]);
  }
}
